import { Injectable } from "@nestjs/common";
import { FindOptions, Identifier, IncludeOptions, Model, Op, Utils, WhereOptions } from "sequelize";
import { AccessControlAdapter, ExportAdapter, TranslateAdapter } from "./adapters";
import { AttributesConfig } from "./models/attributes.model";
import { CustomAttributesConfig } from "./models/custom-attributes.model";
import { DataFilterConfig } from "./models/data-filter.model";
import { ExportTypes } from "./models/export-types.model";
import { OrderModel } from "./models/filter.model";
import { PathModel } from "./models/path.model";
import { SearchAttributesModel } from "./models/search-attributes.model";
import { DataFilterUserModel } from "./models/user.model";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { SequelizeModelScanner } from "./scanners/sequelize-model.scanner";
import { M, SequelizeUtils } from "./sequelize.utils";
import { CsvUtils } from "./utils/csv.utils";
import { XlsxUtils } from "./utils/xlsx.utils";

@Injectable()
export class DataFilterRepository<Data> {
    private _config: DataFilterConfig;
    private _definitions: AttributesConfig[];

    public get model(): typeof M {
        return this._config.model as typeof M;
    }

    constructor(
        private dataDef: any,
        private dataFilterScanner: DataFilterScanner,
        private sequelizeModelScanner: SequelizeModelScanner,
        private accessControlAdapter: AccessControlAdapter,
        private translateService: TranslateAdapter,
        private exportAdapter: ExportAdapter
    ) {
        this.init();
    }

    public async findByPk(identifier: Identifier, options?: FindOptions, conditions?: object): Promise<Data> {
        const result = await this.model.findByPk(identifier, {
            ...this.generateFindOptions(conditions),
            ...(options ?? {})
        });
        if (!result) {
            return result as unknown as Data;
        }
        return this.reduceObject(result);
    }

    public async findByPkFromUser(user: DataFilterUserModel, identifier: Identifier, conditions?: object): Promise<Data> {
        const resources = await this.accessControlAdapter.getResources(this._config.model as any, user);
        if (resources.ids?.includes(identifier as number) || resources.all) {
            return await this.findByPk(identifier, conditions);
        }

        if (resources.ids?.length) {
            return null;
        }
        return await this.findOne({
            where: {
                [Op.and]: [
                    {
                        [this._config.model.primaryKeyAttribute]: identifier
                    },
                    resources.where ?? {}
                ]
            }
        }, conditions);
    }

    public async findOne(options?: FindOptions, conditions?: object): Promise<Data> {
        const result = await this.model.findOne({
            ...this.generateFindOptions(conditions),
            ...(options ?? {})
        });
        if (!result) {
            return result as unknown as Data;
        }
        return this.reduceObject(result);
    }

    public async findOneFromUser(user: DataFilterUserModel, options: FindOptions = {}, conditions?: object): Promise<Data> {
        return this.findOne(
            {
                ...options,
                where: await this.mergeAccessControlCondition(options.where ?? {}, user)
            },
            conditions
        );
    }

    public async findAll(options?: FindOptions, conditions?: object): Promise<Data[]> {
        const result = await this.model.findAll({
            ...this.generateFindOptions(conditions),
            ...(options ?? {})
        });
        if (!result?.length) {
            return result as unknown as Data[];
        }
        return result.map(x => this.reduceObject(x));
    }

    public async findAllFromUser(user: DataFilterUserModel, options?: FindOptions, conditions?: object): Promise<Data[]> {
        options = options ?? {};
        return await this.findAll(
            {
                ...options,
                where: await this.mergeAccessControlCondition(options.where ?? {}, user)
            },
            conditions
        );
    }

    public async count(where?: WhereOptions, conditions?: object): Promise<number> {
        const options = {
            ...this.generateFindOptions(conditions),
            where
        };
        return this.model.count(options);
    }

    public async search(search: string, options?: FindOptions, conditions?: object): Promise<Data[]> {
        const findOptions = this.generateFindOptions(conditions);
        Object.assign(findOptions, options);
        this.addSearchCondition(search, findOptions);

        const result = await this.model.findAll(findOptions);
        if (!result?.length) {
            return result as unknown as Data[];
        }
        return result.map(x => this.reduceObject(x));
    }

    public async searchFromUser(user: DataFilterUserModel, search: string, options?: FindOptions, conditions?: object): Promise<Data[]> {
        const findOptions = this.generateFindOptions(conditions);
        Object.assign(findOptions, options);
        this.addSearchCondition(search, findOptions);

        findOptions.where = await this.mergeAccessControlCondition(findOptions.where, user);
        const result = await this.model.findAll(findOptions);
        if (!result?.length) {
            return result as unknown as Data[];
        }
        return result.map(x => this.reduceObject(x));
    }

    public generateFindOptions(conditions?: object): FindOptions {
        const includes: IncludeOptions[][] = [
            ...this._definitions.map(x => {
                if (!x.path) {
                    return [];
                }
                const path = x.transformPathConfig(conditions);
                const attributes = x.transformAttributesConfig(conditions);
                const additionalIncludes = x.transformIncludesConfig(conditions);
                return this.sequelizeModelScanner.getIncludes(this.model, path, additionalIncludes, attributes);
            }),
            ...this._config.getCustomAttributesIncludes().map(x => this.sequelizeModelScanner.getIncludes(this.model, {
                path: x.path,
                paranoid: x.paranoid,
                subQuery: x.subQuery
            }, [], x.attributes))
        ];

        const attributes = this._config.transformAttributesConfig(conditions);

        if (attributes) {
            return {
                attributes: attributes,
                include: SequelizeUtils.reduceIncludes(includes)
            };
        }

        return {
            include: SequelizeUtils.reduceIncludes(includes)
        };
    }

    public generateOrderInclude(order: OrderModel): IncludeOptions[] {
        if (!order || !order.column || order.direction === "") {
            return [];
        }

        const customAttr = this.getCustomAttribute(order.column);
        if (customAttr) {
            if (!customAttr.config.path) {
                return [];
            }

            return this.sequelizeModelScanner.getIncludes(this.model, { path: customAttr.config.path }, []);
        }

        return this.sequelizeModelScanner.getOrderIncludes(this.model, order);
    }

    public reduceObject(result: any): Data {
        const r = result instanceof Model ? result.toJSON() : result;
        const data = new this.dataDef.prototype.constructor({}, { isNewRecord: false });
        Object.assign(data, r);
        if (data instanceof Model) {
            (data as any).dataValues = {
                ...r
            };
        }

        for (const def of this._definitions) {
            if (def.path) {
                data[def.key] = SequelizeUtils.reduceModelFromPath(result, def.path.path);
                if (data instanceof Model) {
                    data.setDataValue(def.key as any, SequelizeUtils.reduceModelFromPath(result, def.path.path));
                }
                continue;
            }

            data[def.key] = result[def.key];
        }

        return data;
    }

    public getSearchAttributes(): SearchAttributesModel[] {
        const attributes: SearchAttributesModel[] = [];
        const modelAttr = this._config.getSearchableAttributes();
        attributes.push(
            ...modelAttr.map(a => ({
                name: a,
                key: a,
                isJson: SequelizeUtils.isColumnJson(this.model, a)
            }))
        );

        for (const definition of this._definitions) {
            if (!definition.path) {
                continue;
            }

            const attr = definition.ignoreInSearch ? [] : definition.searchableAttributes ?? definition.attributes;
            const additionalIncludes = definition.transformIncludesConfig({});
            attributes.push(
                ...this.sequelizeModelScanner.getAttributes(
                    this.model,
                    definition.path as PathModel,
                    additionalIncludes,
                    attr
                )
            );
        }

        return attributes;
    }

    public hasCustomAttribute(name: string): boolean {
        return !!this._config.customAttributes.find((x) => x.config.name === name);
    }

    public getCustomAttribute(name: string): CustomAttributesConfig {
        return this._config.customAttributes.find((x) => x.config.name === name);
    }

    public async downloadData(data: Data[], type: ExportTypes, lang: string, options?: any): Promise<Buffer | string>;
    public async downloadData(headers: string[], data: any[], type: ExportTypes, lang: string, options?: any): Promise<Buffer | string>;
    public async downloadData(
        dataOrHeaders: Data[] | string[],
        typeOrData: ExportTypes | any[],
        langOrType: string | ExportTypes,
        optionsOrLang?: any | string,
        options?: any
    ): Promise<Buffer | string> {
        let type: ExportTypes;
        let headers: string[];
        let data: any[];
        let lang: string;

        if (typeof typeOrData === "string") {
            type = typeOrData;
            lang = langOrType;
            headers = await this.getExportsHeader(lang, this._config.exportColumns ?? []);
            data = await this.getExportData(dataOrHeaders as Data[]);
            options = optionsOrLang;
        } else {
            lang = optionsOrLang as string;
            headers = await this.getExportsHeader(lang, dataOrHeaders as string[]);
            data = typeOrData;
            type = langOrType as ExportTypes;
        }

        switch (type) {
            case ExportTypes.XLSX:
                return await this.downloadXlsx(headers, data);
            case ExportTypes.HTML:
                return await this.downloadHtml(headers, data, lang, options);
            case ExportTypes.CSV:
                return await this.downloadCsv(headers, data);
            case ExportTypes.PDF:
                return await this.downloadPdf(headers, data, options);
            case ExportTypes.ZIP:
                return await this.downloadZip(headers, data, options);
        }
    }

    public async downloadXlsx(headers: string[], data: any[]): Promise<Buffer> {
        return XlsxUtils.arrayToXlsxBuffer(
            data,
            this._config.model.getTableName() as string,
            headers
        );
    }

    public async downloadHtml(headers: string[], data: any[], lang: string, options?: any): Promise<string> {
        return this.exportAdapter.exportAsHtml(lang, {
            title: this._config.model.getTableName() as string,
            columns: headers,
            data: data
        }, options);
    }

    public async downloadCsv(headers: string[], data: any[]): Promise<Buffer> {
        return await CsvUtils.arrayToCsvBuffer(data, headers);
    }

    public async downloadPdf(headers: string[], data: any[], lang: string, options?: any): Promise<Buffer> {
        return this.exportAdapter.exportAsPdf(lang, {
            title: this._config.model.getTableName() as string,
            columns: headers,
            data: data
        }, options);
    }

    public async downloadZip(headers: string[], data: any[], lang: string, options?: any): Promise<Buffer> {
        return this.exportAdapter.exportAsZip(lang, {
            title: this._config.model.getTableName() as string,
            columns: headers,
            data: data
        }, options);
    }

    private init() {
        this._config = this.dataFilterScanner.getDataFilter(this.dataDef);
        this._definitions = this.dataFilterScanner.getAttributes(this.dataDef);
    }

    public addSearchCondition(search: string, options: FindOptions): void {
        if (!search) {
            return;
        }

        const repoOption = this.generateFindOptions({});
        options.include = SequelizeUtils.mergeIncludes(
            options.include as IncludeOptions[],
            repoOption.include as IncludeOptions[]
        );

        if (!options.where) {
            options.where = { [Op.and]: [] };
        } else {
            options.where = { [Op.and]: [options.where] };
        }

        const where = options.where;
        const generateFieldsObject = searchValue =>
            this.getSearchAttributes()
                .map(a => {
                    if (a.isJson) {
                        const field = a.literalKey ?? `\`${this.model.name}\`.\`${a.key}\``;

                        /**
                         * literal function is not working of some reason...
                         * This is the equivalent
                         */
                        const value = this.model.sequelize.escape(`%${searchValue.toUpperCase()}%`);
                        return new Utils.Literal(`UPPER(JSON_EXTRACT(${field}, '$')) LIKE ${value}`);
                    }
                    return {
                        [a.key]: {
                            [Op.like]: `%${searchValue}%`
                        }
                    };
                }).filter(x => !!x);

        const tokens = search.split(" ");
        where[Op.and].push(
            tokens.map(t => {
                return {
                    [Op.or]: generateFieldsObject(t)
                };
            })
        );
    }

    private getExportsHeader(lang: string, headers: string[], translateService = this.translateService): Promise<string[]> {
        return Promise.all(headers.map(x => translateService.getTranslation(lang, `exports.${x}`)));
    }

    private getExportData(data: Data[]): object[] {
        return data.map(x => {
            const result = {};
            let i = 0;
            for (const key of this._config.exportColumns) {
                const [value, prop] = this.getExportValue(x, key);
                result[`${i++}:${prop}`] = value;
            }
            return result;
        });
    }

    private getExportValue(data: Data, path: string): [unknown, string] {
        const keys = path.split(".");
        if (keys.length === 1) {
            const key = keys.pop();
            return [data[key], key];
        }

        let key: string;
        while (keys.length) {
            key = keys.shift();
            if (data) {
                data = data[key];
            }
        }

        return [data, key];
    }

    private async mergeAccessControlCondition(where: WhereOptions, user: DataFilterUserModel): Promise<WhereOptions> {
        const resources = await this.accessControlAdapter.getResources(this._config.model as any, user);
        if (resources.ids) {
            return SequelizeUtils.mergeWhere({ id: resources.ids }, where);
        } else if (resources.where) {
            return {
                [Op.and]: [
                    where,
                    resources.where
                ]
            };
        }

        return where;
    }
}

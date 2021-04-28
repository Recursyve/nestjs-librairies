import { Injectable } from "@nestjs/common";
import { FindOptions, Identifier, IncludeOptions, Model, Op, Utils, WhereOptions, Sequelize } from "sequelize";
import * as sequelize from "sequelize";
import { AccessControlAdapter, ExportAdapter, TranslateAdapter } from "./adapters";
import { AttributesConfig } from "./models/attributes.model";
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
        const ids = await this.accessControlAdapter.getResourceIds(this._config.model as any, user);
        if (!ids.includes(identifier as number)) {
            return null;
        }
        return await this.findByPk(identifier, conditions);
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
        const ids = await this.accessControlAdapter.getResourceIds(this._config.model as any, user);
        return await this.findAll(
            {
                ...options,
                where: SequelizeUtils.mergeWhere({ id: ids }, options.where)
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

        const ids = await this.accessControlAdapter.getResourceIds(this._config.model as any, user);
        findOptions.where = SequelizeUtils.mergeWhere({ id: ids }, findOptions.where);

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
                path: x.path
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

    public async downloadData(data: Data[], type: ExportTypes, lang: string, options?: any): Promise<Buffer | string> {
        switch (type) {
            case ExportTypes.XLSX:
                return await this.downloadXlsx(data, lang);
            case ExportTypes.HTML:
                return await this.downloadHtml(data, lang, options);
            case ExportTypes.CSV:
                return await this.downloadCsv(data, lang);
            case ExportTypes.PDF:
                return await this.downloadPdf(data, lang, options);
        }
    }

    public async downloadXlsx(data: Data[], lang: string): Promise<Buffer> {
        return XlsxUtils.arrayToXlsxBuffer(
            this.getExportData(data),
            this._config.model.getTableName() as string,
            await this.getExportsHeader(lang)
        );
    }

    public async downloadHtml(data: Data[], lang: string, options?: any): Promise<string> {
        return this.exportAdapter.exportAsHtml(lang, {
            title: this._config.model.getTableName() as string,
            columns: await this.getExportsHeader(lang),
            data: this.getExportData(data)
        }, options);
    }

    public async downloadCsv(data: Data[], lang: string): Promise<Buffer> {
        return await CsvUtils.arrayToCsvBuffer(this.getExportData(data), await this.getExportsHeader(lang));
    }

    public async downloadPdf(data: Data[], lang: string, options?: any): Promise<Buffer> {
        return this.exportAdapter.exportAsPdf(lang, {
            title: this._config.model.getTableName() as string,
            columns: await this.getExportsHeader(lang),
            data: this.getExportData(data)
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

    private getExportsHeader(lang: string, translateService = this.translateService): Promise<string[]> {
        return Promise.all(this._config.exportColumns.map(x => translateService.getTranslation(lang, `exports.${x}`)));
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
}

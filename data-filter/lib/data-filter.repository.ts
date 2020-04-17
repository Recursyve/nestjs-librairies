import { Injectable } from "@nestjs/common";
import { FindOptions, Identifier, IncludeOptions, Model, ProjectionAlias, WhereOptions } from "sequelize";
import { ExportAdapter } from "./adapters/export.adapter";
import { TranslateAdapter } from "./adapters/translate.adapter";
import { AttributesConfig } from "./models/attributes.model";
import { DataFilterConfig } from "./models/data-filter.model";
import { ExportTypes } from "./models/export-types.model";
import { OrderModel } from "./models/filter.model";
import { PathModel } from "./models/path.model";
import { SearchAttributesModel } from "./models/search-attributes.model";
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

    public count(where?: WhereOptions, conditions?: object): Promise<number> {
        const options = {
            ...this.generateFindOptions(conditions),
            where
        };
        return this.model.count(options);
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

        const objects = order.column.split(".");
        const column = objects.pop();
        const definition = this._definitions.filter(x => x.attributes).find(x => {
            return (x.attributes as (string | ProjectionAlias)[]).some(attribute => {
                if (typeof attribute === "string") {
                    return attribute === column;
                }
                const attr = attribute[attribute.length - 1];
                return attr === column
            });
        });

        if (!definition) {
            return [];
        }

        if (!definition.path) {
            return [];
        }
        const path = definition.transformPathConfig({});
        const additionalIncludes = definition.transformIncludesConfig({});
        const attributes = definition.transformAttributesConfig({});
        return this.sequelizeModelScanner.getIncludes(this.model, path, additionalIncludes, attributes);
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
        const modelAttr = this._config.attributes
            ? (this._config.attributes as string[])
            : SequelizeUtils.getModelSearchableAttributes(this.model);
        attributes.push(
            ...modelAttr.map(a => ({
                name: a,
                key: a
            }))
        );

        for (const definition of this._definitions) {
            if (!definition.path || definition.ignoreInSearch) {
                continue;
            }

            const additionalIncludes = definition.transformIncludesConfig({});
            attributes.push(
                ...this.sequelizeModelScanner.getAttributes(
                    this.model,
                    definition.path as PathModel,
                    additionalIncludes,
                    definition.attributes
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
            this.getExportsHeader(lang)
        );
    }

    public async downloadHtml(data: Data[], lang: string, options?: any): Promise<string> {
        return this.exportAdapter.exportAsHtml(lang, {
            title: this._config.model.getTableName() as string,
            columns: this.getExportsHeader(lang),
            data: this.getExportData(data)
        }, options);
    }

    public async downloadCsv(data: Data[], lang: string): Promise<Buffer> {
        return await CsvUtils.arrayToCsvBuffer(this.getExportData(data), this.getExportsHeader(lang));
    }

    public async downloadPdf(data: Data[], lang: string, options?: any): Promise<Buffer> {
        return this.exportAdapter.exportAsPdf(lang, {
            title: this._config.model.getTableName() as string,
            columns: this.getExportsHeader(lang),
            data: this.getExportData(data)
        }, options);
    }

    private init() {
        this._config = this.dataFilterScanner.getDataFilter(this.dataDef);
        this._definitions = this.dataFilterScanner.getAttributes(this.dataDef);
    }

    private getExportsHeader(lang: string, translateService = this.translateService): string[] {
        return this._config.exportColumns.map(x => translateService.getTranslation(lang, `exports.${x}`));
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

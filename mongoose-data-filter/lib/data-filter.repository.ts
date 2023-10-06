import { Injectable } from "@nestjs/common";
import {
    Aggregate,
    Connection,
    FilterQuery,
    QueryOptions,
    Model
} from "mongoose";
import { AccessControlAdapter, ExportAdapter, TranslateAdapter } from "./adapters";
import { AddFieldModel } from "./models/add-field.model";
import { AttributesConfig } from "./models/attributes.model";
import { DataFilterConfig } from "./models/data-filter.model";
import { ExportTypes } from "./models/export-types.model";
import { OrderModel } from "./models/filter.model";
import { TransformationsConfig } from "./models/transformations/transformations.model";
import { MongoUtils } from "./mongo.utils";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { MongoSchemaScanner } from "./scanners/mongo-schema.scanner";
import { CsvUtils } from "./utils/csv.utils";
import { XlsxUtils } from "./utils/xlsx.utils";

@Injectable()
export class DataFilterRepository<Data> {
    private _config: DataFilterConfig;
    private _definitions: AttributesConfig[];
    private _transformations: TransformationsConfig[];

    public get model(): Model<any> {
        return this._config.model;
    }

    constructor(
        private dataDef: any,
        private dataFilterScanner: DataFilterScanner,
        private mongoSchemaScanner: MongoSchemaScanner,
        private accessControlAdapter: AccessControlAdapter,
        private translateAdapter: TranslateAdapter,
        private exportAdapter: ExportAdapter,
        private connection: Connection
    ) {
        this.init();
    }

    public async findOne(
        conditions?: FilterQuery<Data>,
        projection?: any | null,
        options?: QueryOptions,
        config?: object,
        addFields?: AddFieldModel[]
    ): Promise<Data> {
        const aggregation = this.getFilterAggregation(conditions, {
            ...(options ?? {}),
            projection: options?.projection ?? projection,
            limit: 1
        }, config, addFields);
        const result = await aggregation.exec().then(x => x.shift());
        return this.transformObject(result);
    }

    public async find(
        conditions?: FilterQuery<Data>,
        projection?: any | null,
        options?: QueryOptions,
        config?: object,
        addFields?: AddFieldModel[]
    ): Promise<Data[]> {
        const aggregation = this.getFilterAggregation(conditions, {
            ...(options ?? {}),
            projection: options?.projection ?? projection
        }, config, addFields);
        const results = await aggregation.exec();
        return results.map(x => this.transformObject(x));
    }

    public async count(conditions?: FilterQuery<Data>): Promise<Data[]> {
        const aggregation = this.getFilterAggregation(conditions);
        return await aggregation.count("total").exec().then(x => x?.shift()?.total)
    }

    public getLookups(config?: object): any[] {
        const lookups: any[][] = [
            ...this._definitions.map(x => {
                if (!x.path) {
                    return [];
                }
                const path = x.transformPathConfig(config);
                const fieldsToAdd = x.getFieldsToAdd();
                return this.mongoSchemaScanner.getLookups(this.model.schema, path, x.includes, x.attributes, fieldsToAdd);
            })
        ];

        return MongoUtils.reduceLookups(lookups);
    }

    public generateOrderLookup(order: OrderModel, config?: object): any[] {
        if (!order || !order.column || order.direction === "") {
            return [];
        }

        const objects = order.column.split(".");
        objects.pop();
        const definition = this._definitions.find(x => x.path?.path === objects.join("."));

        if (!definition) {
            return [];
        }

        if (!definition.path) {
            return [];
        }
        return this.mongoSchemaScanner.getLookups(
            this.model.schema,
            definition.transformPathConfig(config),
            definition.includes,
            definition.attributes
        );
    }

    public getFilterAggregation(
        conditions?: FilterQuery<any>,
        options?: QueryOptions,
        config?: object,
        addFields?: AddFieldModel[]
    ): Aggregate<any> {
        let aggregation = this.model.aggregate(this.getLookups(config));

        if (conditions) {
            aggregation = aggregation.match(conditions);
        }
        if (addFields?.length) {
            aggregation = aggregation.addFields(MongoUtils.reduceFieldsToAdd(addFields));
        }

        if (!options) {
            return aggregation;
        }

        if (options.sort) {
            aggregation = aggregation.sort(options.sort);
        }
        if (options.projection) {
            aggregation = aggregation.project(options.projection as any);
        }
        if (options.skip) {
            aggregation = aggregation.skip(options.skip);
        }
        if (options.limit) {
            aggregation = aggregation.skip(options.limit);
        }

        const [fieldsToAdd, unwindFields] = this._config.getFieldsToAdd();
        if (fieldsToAdd) {
            aggregation = aggregation.addFields(fieldsToAdd);

            if (unwindFields.length) {
                aggregation = aggregation.unwind(...unwindFields.map(x => ({ path: `$${x}`, preserveNullAndEmptyArrays: true })));
            }
        }

        return aggregation;
    }

    public transformObject(data: Data): Data {
        if (!this._transformations.length) {
            return data;
        }

        for (const transformation of this._transformations) {
            data[transformation.key] = transformation.transform(data[transformation.key], data);
        }

        return data;
    }

    public async downloadData(data: Data[], type: ExportTypes, lang: string, options?: any): Promise<Buffer | string> {
        if (!this._config.exportColumns) {
            throw new Error("No export columns provided!");
        }

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
            this._config.model.collection.collectionName,
            await this.getExportsHeader(lang)
        );
    }

    public async downloadHtml(data: Data[], lang: string, options?: any): Promise<string> {
        return this.exportAdapter.exportAsHtml(lang, {
            title: this._config.model.collection.collectionName,
            columns: await this.getExportsHeader(lang),
            data: this.getExportData(data)
        }, options);
    }

    public async downloadCsv(data: Data[], lang: string): Promise<Buffer> {
        return await CsvUtils.arrayToCsvBuffer(this.getExportData(data), await this.getExportsHeader(lang));
    }

    public async downloadPdf(data: Data[], lang: string, options?: any): Promise<Buffer> {
        return this.exportAdapter.exportAsPdf(lang, {
            title: this._config.model.collection.collectionName,
            columns: await this.getExportsHeader(lang),
            data: this.getExportData(data)
        }, options);
    }

    private init() {
        this._config = this.dataFilterScanner.getDataFilter(this.dataDef);
        this._config.model = this.connection.model(this._config.model.name);

        this._definitions = this.dataFilterScanner.getAttributes(this.dataDef);
        this._transformations = this.dataFilterScanner.getTransformations(this.dataDef);
    }

    private getExportsHeader(lang: string, translateAdapter = this.translateAdapter): Promise<string[]> {
        return Promise.all(this._config.exportColumns.map(x => translateAdapter.getTranslation(lang, `exports.${x}`)));
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

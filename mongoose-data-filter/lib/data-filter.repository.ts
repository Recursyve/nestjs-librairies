import { Injectable } from "@nestjs/common";
import {
    Aggregate,
    Connection,
    FilterQuery,
    Model,
    MongooseFilterQuery,
    QueryFindBaseOptions,
    QueryFindOptions
} from "mongoose";
import { AddFieldModel } from "./models/add-field.model";
import { AttributesConfig } from "./models/attributes.model";
import { DataFilterConfig } from "./models/data-filter.model";
import { OrderModel } from "./models/filter.model";
import { TransformationsConfig } from "./models/transformations/transformations.model";
import { MongoUtils } from "./mongo.utils";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { MongoSchemaScanner } from "./scanners/mongo-schema.scanner";

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
        private connection: Connection
    ) {
        this.init();
    }

    public async findOne(
        conditions?: FilterQuery<Data>,
        projection?: any | null,
        options?: QueryFindBaseOptions,
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
        options?: QueryFindOptions,
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
        conditions?: MongooseFilterQuery<any>,
        options?: QueryFindOptions,
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
            aggregation = aggregation.project(options.projection);
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

    private init() {
        this._config = this.dataFilterScanner.getDataFilter(this.dataDef);
        this._config.model = this.connection.model(this._config.model.name);

        this._definitions = this.dataFilterScanner.getAttributes(this.dataDef);
        this._transformations = this.dataFilterScanner.getTransformations(this.dataDef);
    }
}

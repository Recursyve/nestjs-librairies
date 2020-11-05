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
import { AttributesConfig } from "./models/attributes.model";
import { DataFilterConfig } from "./models/data-filter.model";
import { MongoUtils } from "./mongo.utils";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { MongoSchemaScanner } from "./scanners/mongo-schema.scanner";

@Injectable()
export class DataFilterRepository<Data> {
    private _config: DataFilterConfig;
    private _definitions: AttributesConfig[];

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

    public findOne(conditions?: FilterQuery<Data>, projection?: any | null, options?: QueryFindBaseOptions): Promise<Data> {
        const aggregation = this.getFilterAggregation(conditions, {
            projection: options?.projection ?? projection,
            limit: 1
        });
        return aggregation.exec().then(x => x.shift());
    }

    public find(conditions?: FilterQuery<Data>, projection?: any | null, options?: QueryFindOptions): Promise<Data[]> {
        const aggregation = this.getFilterAggregation(conditions, {
            projection: options?.projection ?? projection
        });
        return aggregation.exec();
    }

    public count(conditions?: FilterQuery<Data>): Promise<Data[]> {
        const aggregation = this.getFilterAggregation(conditions);
        return aggregation.count("total").exec().then(x => x?.shift()?.total)
    }

    public getLookups(): any[] {
        const lookups: any[][] = [
            ...this._definitions.map(x => {
                if (!x.path) {
                    return [];
                }
                return this.mongoSchemaScanner.getLookups(this.model.schema, x.path, x.includes);
            })
        ];

        return MongoUtils.reduceLookups(lookups);
    }

    public getSearchAttributes(): string[] {
        const attributes: string[] = [];
        const modelAttr = this.mongoSchemaScanner.getSchemaFields(this.model.schema);
        attributes.push(...modelAttr);

        for (const definition of this._definitions) {
            if (!definition.path) {
                continue;
            }

            attributes.push(
                ...this.mongoSchemaScanner.getFields(
                    this.model.schema,
                    definition.path,
                    definition.includes
                )
            );
        }

        return attributes;
    }

    public getFilterAggregation(conditions?: MongooseFilterQuery<any>, options?: QueryFindOptions): Aggregate<any> {
        let aggregation = this.model.aggregate(this.getLookups());

        if (conditions) {
            aggregation = aggregation.match(conditions);
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

        return aggregation;
    }

    private init() {
        this._config = this.dataFilterScanner.getDataFilter(this.dataDef);
        this._config.model = this.connection.model(this._config.model.name);

        this._definitions = this.dataFilterScanner.getAttributes(this.dataDef);
    }
}

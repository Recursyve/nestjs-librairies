import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { PathModel } from "../../data-filter/lib/models/path.model";
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
        private mongoSchemaScanner: MongoSchemaScanner
    ) {
        this.init();
    }

    public getLookups(): any[] {
        const lookups: any[][] = [
            ...this._definitions.map(x => {
                if (!x.path) {
                    return [];
                }
                return this.mongoSchemaScanner.getLookups(this.model.schema, x.path);
            })
        ];

        return MongoUtils.reduceLookups(lookups);
    }

    public getSearchAttributes(): string[] {
        const attributes: string[] = [];
        const modelAttr = this._config.getSearchableAttributes();
        attributes.push(
            ...modelAttr.map(a => ({
                name: a,
                key: a
            }))
        );

        for (const definition of this._definitions) {
            if (!definition.path) {
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

    private init() {
        this._config = this.dataFilterScanner.getDataFilter(this.dataDef);
        this._definitions = this.dataFilterScanner.getAttributes(this.dataDef);
    }
}

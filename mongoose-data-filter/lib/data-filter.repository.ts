import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { SequelizeUtils } from "../../data-filter/lib/sequelize.utils";
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

    private init() {
        this._config = this.dataFilterScanner.getDataFilter(this.dataDef);
        this._definitions = this.dataFilterScanner.getAttributes(this.dataDef);
    }
}

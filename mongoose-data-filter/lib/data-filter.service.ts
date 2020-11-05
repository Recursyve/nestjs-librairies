import { Injectable, Type } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { DataFilterRepository } from "./data-filter.repository";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { MongoSchemaScanner } from "./scanners/mongo-schema.scanner";

@Injectable()
export class DataFilterService {
    constructor(
        @InjectConnection() private connection: Connection,
        private dataFilterScanner: DataFilterScanner,
        private mongoSchemaScanner: MongoSchemaScanner
    ) {}

    public for<T>(data: Type<T>): DataFilterRepository<T> {
        return new DataFilterRepository<T>(
            data,
            this.dataFilterScanner,
            this.mongoSchemaScanner,
            this.connection
        );
    }
}

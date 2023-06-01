import { Injectable, Type } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { AccessControlAdapter, ExportAdapter, TranslateAdapter } from "./adapters";
import { DataFilterRepository } from "./data-filter.repository";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { MongoSchemaScanner } from "./scanners/mongo-schema.scanner";

@Injectable()
export class DataFilterService {
    constructor(
        @InjectConnection() private connection: Connection,
        private dataFilterScanner: DataFilterScanner,
        private mongoSchemaScanner: MongoSchemaScanner,
        private accessControlAdapter: AccessControlAdapter,
        private translateAdapter: TranslateAdapter,
        private exportAdapter: ExportAdapter
    ) {}

    public for<T>(data: Type<T>): DataFilterRepository<T> {
        return new DataFilterRepository<T>(
            data,
            this.dataFilterScanner,
            this.mongoSchemaScanner,
            this.accessControlAdapter,
            this.translateAdapter,
            this.exportAdapter,
            this.connection
        );
    }
}

import { Type } from "@nestjs/common";
import { AccessControlAdapter } from "../adapters/access-control.adapter";
import { TranslateAdapter } from "../adapters/translate.adapter";
import { MongoSchemaScanner } from "../scanners/mongo-schema.scanner";
import { BaseFilter } from "./base-filter";
import { FilterService } from "./filter.service";
import { DataFilterScanner } from "../scanners/data-filter.scanner";

export function FilterServiceFactory<T>(
    accessControlAdapter: AccessControlAdapter,
    translateAdapter: TranslateAdapter,
    filter: BaseFilter<T>,
    mongoSchemaScanner: MongoSchemaScanner,
    dataFilterService: DataFilterScanner
) {
    return new FilterService(accessControlAdapter, translateAdapter, filter, mongoSchemaScanner, dataFilterService);
}

export function FilterFactory<T>(filter: Type<T>) {
    return (...args) => {
        /**
         * Check if all dependencies are injected
         */
        if (filter.prototype.constructor.length !== args.length) {
            throw new Error(`Not enough dependencies were provided for ${filter.name}: expected ${filter.prototype.constructor.length}, received ${args.length}`)
        }

        return new filter(...args);
    };
}

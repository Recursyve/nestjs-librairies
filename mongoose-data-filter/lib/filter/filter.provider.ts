import { Provider, Type } from "@nestjs/common";
import { AccessControlAdapter, TranslateAdapter } from "../adapters";
import { DataFilterService } from "../data-filter.service";
import { MongoSchemaScanner } from "../scanners/mongo-schema.scanner";
import { BaseFilter } from "./base-filter";
import { FilterServiceFactory } from "./filter.factory";
import { FilterUtils } from "./filter.utils";

export function createFilterProvider(filter: Type<BaseFilter<any>>): Provider {
    return {
        provide: FilterUtils.getProviderToken(filter),
        useFactory: FilterServiceFactory,
        inject: [AccessControlAdapter, TranslateAdapter, filter, MongoSchemaScanner, DataFilterService]
    };
}
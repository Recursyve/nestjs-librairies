import { Provider, Type } from "@nestjs/common";
import { AccessControlAdapter } from "../adapters";
import { DataFilterService } from "../data-filter.service";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { BaseFilter } from "./base-filter";
import { FilterServiceFactory } from "./filter.factory";
import { FilterUtils } from "./filter.utils";

export function createFilterProvider(filter: Type<BaseFilter<any>>): Provider {
    return {
        provide: FilterUtils.getProviderToken(filter),
        useFactory: FilterServiceFactory,
        inject: [AccessControlAdapter, filter, SequelizeModelScanner, DataFilterService]
    };
}

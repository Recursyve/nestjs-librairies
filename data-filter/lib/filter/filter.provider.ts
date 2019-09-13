import { Provider, Scope, Type } from "@nestjs/common";
import { BaseFilter } from "./base-filter";
import { FilterServiceFactory } from "./filter.factory";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { DataFilterService } from "../data-filter.service";
import { FilterUtils } from "./filter.utils";

export function createFilterProvider(filter: Type<BaseFilter<any>>): Provider {
    return {
        provide: FilterUtils.getProviderToken(filter),
        useFactory: FilterServiceFactory,
        inject: [filter, SequelizeModelScanner, DataFilterService]
    };
}

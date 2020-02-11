import { Provider, Type } from "@nestjs/common";
import { AccessControlService } from "@recursyve/nestjs-access-control";
import { BaseFilter } from "./base-filter";
import { FilterServiceFactory } from "./filter.factory";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { DataFilterService } from "../data-filter.service";
import { FilterUtils } from "./filter.utils";

export function createFilterProvider(filter: Type<BaseFilter<any>>): Provider {
    return {
        provide: FilterUtils.getProviderToken(filter),
        useFactory: FilterServiceFactory,
        inject: [AccessControlService, filter, SequelizeModelScanner, DataFilterService]
    };
}

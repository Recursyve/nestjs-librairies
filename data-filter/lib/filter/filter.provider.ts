import { Provider, Type } from "@nestjs/common";
import { AccessControlAdapter, TranslateAdapter } from "../adapters";
import { DataFilterService } from "../data-filter.service";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { DialectFormatterService } from "../services/dialect-formatter.service";
import { BaseFilter } from "./base-filter";
import { FilterServiceFactory } from "./filter.factory";
import { FilterUtils } from "./filter.utils";

export function createFilterProvider(filter: Type<BaseFilter<any>>, disableAccessControl?: boolean): Provider {
    return {
        provide: FilterUtils.getProviderToken(filter),
        useFactory: FilterServiceFactory({ disableAccessControl }),
        inject: [AccessControlAdapter, TranslateAdapter, filter, SequelizeModelScanner, DataFilterService, DialectFormatterService]
    };
}

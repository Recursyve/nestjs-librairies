import { Type } from "@nestjs/common";
import { AccessControlService } from "@recursyve/nestjs-access-control";
import { DataFilterService } from "../data-filter.service";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { BaseFilter } from "./base-filter";
import { FilterService } from "./filter.service";

export function FilterServiceFactory<T>(
    accessControlService: AccessControlService,
    filter: BaseFilter<T>,
    sequelizeModelScanner: SequelizeModelScanner,
    dataFilterService: DataFilterService
) {
    return new FilterService(accessControlService, filter, sequelizeModelScanner, dataFilterService);
}

export function FilterFactory<T>(filter: Type<T>) {
    return (...args) => {
        return new filter(...args);
    };
}

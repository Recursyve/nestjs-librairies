import { Type } from "@nestjs/common";
import { DataFilterService } from "../data-filter.service";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { BaseFilter } from "./base-filter";
import { FilterService } from "./filter.service";

export function FilterServiceFactory<T>(
    filter: BaseFilter<T>,
    sequelizeModelScanner: SequelizeModelScanner,
    dataFilterService: DataFilterService
) {
    return new FilterService(filter, sequelizeModelScanner, dataFilterService);
}

export function FilterFactory<T>(filter: Type<T>) {
    return (...args) => {
        return new filter(...args);
    };
}

import { Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Injector } from "@nestjs/core/injector/injector";
import { AccessControlService } from "@recursyve/nestjs-access-control";
import { DataFilterService } from "../data-filter.service";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { BaseFilter } from "./base-filter";
import { FilterService } from "./filter.service";

export function FilterServiceFactory<T>(
    moduleRef: ModuleRef,
    filter: BaseFilter<T>,
    sequelizeModelScanner: SequelizeModelScanner,
    dataFilterService: DataFilterService
) {
    let accessControlService: AccessControlService;
    try {
        accessControlService = moduleRef.get(AccessControlService, { strict: false });
    } catch (e) {}
    return new FilterService(accessControlService, filter, sequelizeModelScanner, dataFilterService);
}

export function FilterFactory<T>(filter: Type<T>) {
    return (...args) => {
        return new filter(...args);
    };
}

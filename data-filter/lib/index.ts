import { DynamicModule, Global, Module, Provider, Type } from "@nestjs/common";
import { AccessControlModule } from "@recursyve/nestjs-access-control";
import { DataFilterService } from "./data-filter.service";
import { BaseFilter } from "./filter/base-filter";
import { FilterFactory } from "./filter/filter.factory";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { SequelizeModelScanner } from "./scanners/sequelize-model.scanner";
import { createFilterProvider } from "./filter/filter.provider";

@Global()
@Module({
    imports: [AccessControlModule],
    providers: [DataFilterScanner, SequelizeModelScanner, DataFilterService],
    exports: [DataFilterScanner, SequelizeModelScanner, DataFilterService]
})
export class DataFilterModule {
    public static forFeature(filters: Type<BaseFilter<any>>[]): DynamicModule {
        return {
            module: DataFilterModule,
            providers: filters.map(filter => createFilterProvider(filter))
        };
    }
}

export class DataFilterProvider {
    public static forFeature(filter: Type<BaseFilter<any>>, inject?: any[]): Provider[] {
        return [
            {
                provide: filter,
                useFactory: FilterFactory(filter),
                inject
            },
            createFilterProvider(filter)
        ];
    }
}

export * from "./decorators";
export * from "./filter";
export * from "./models/filter.model";

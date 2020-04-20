import { DynamicModule, Global, Module, Provider, Type } from "@nestjs/common";
import { ExportAdapter } from "./adapters";
import { AccessControlAdapter } from "./adapters/access-control.adapter";
import { DefaultAccessControlAdapter } from "./adapters/default-access-control.adapter";
import { DefaultExportAdapter } from "./adapters/default-export.adapter";
import { DefaultTranslateAdapter } from "./adapters/default-translate.adapter";
import { TranslateAdapter } from "./adapters/translate.adapter";
import { DataFilterService } from "./data-filter.service";
import { DefaultDeserializer, UserDeserializer } from "./deserializers";
import { BaseFilter } from "./filter/base-filter";
import { FilterFactory } from "./filter/filter.factory";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { SequelizeModelScanner } from "./scanners/sequelize-model.scanner";
import { createFilterProvider } from "./filter/filter.provider";

export interface DataFilterConfig {
    imports?: Type<any>[];
    deserializer?: Provider;
    accessControlAdapter?: Provider;
    translateAdapter?: Provider;
    exportAdapter?: Provider;
}

@Global()
@Module({
    providers: [DataFilterScanner, SequelizeModelScanner, DataFilterService],
    exports: [DataFilterScanner, SequelizeModelScanner, DataFilterService]
})
export class DataFilterModule {
    public static forRoot(option?: DataFilterConfig): DynamicModule {
        option = {
            imports: option?.imports ?? [],
            deserializer: option?.deserializer ?? {
                provide: UserDeserializer,
                useClass: DefaultDeserializer
            },
            accessControlAdapter: option?.accessControlAdapter ?? {
                provide: AccessControlAdapter,
                useClass: DefaultAccessControlAdapter
            },
            translateAdapter: option?.translateAdapter ?? {
                provide: TranslateAdapter,
                useClass: DefaultTranslateAdapter
            },
            exportAdapter: option?.exportAdapter ?? {
                provide: ExportAdapter,
                useClass: DefaultExportAdapter
            }
        };
        return {
            module: DataFilterModule,
            imports: [...option.imports],
            providers: [
                option.deserializer,
                option.accessControlAdapter,
                option.translateAdapter,
                option.exportAdapter
            ],
            exports: [
                UserDeserializer,
                AccessControlAdapter,
                TranslateAdapter,
                ExportAdapter
            ]
        };
    }

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

export * from "./data-filter.service";
export * from "./data-filter.repository";
export * from "./adapters";
export * from "./decorators";
export * from "./deserializers";
export * from "./filter";
export * from "./models/export-types.model";
export * from "./models/filter.model";
export * from "./models/include.model";
export * from "./models/user.model";

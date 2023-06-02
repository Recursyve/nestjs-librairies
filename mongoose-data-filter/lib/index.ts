import { DynamicModule, ForwardReference, Global, Module, Provider, Type } from "@nestjs/common";
import {
    AccessControlAdapter,
    DefaultAccessControlAdapter,
    DefaultExportAdapter,
    DefaultTranslateAdapter,
    ExportAdapter,
    TranslateAdapter
} from "./adapters";
import { FILTER_OPTION } from "./constant";
import { DataFilterService } from "./data-filter.service";
import { DefaultDeserializer, UserDeserializer } from "./deserializers";
import { BaseFilter, FilterUtils } from "./filter";
import { defaultFilterOptionConfig, FilterOptionConfig } from "./filter/filter.config";
import { FilterFactory } from "./filter/filter.factory";
import { createFilterProvider } from "./filter/filter.provider";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { MongoSchemaScanner } from "./scanners/mongo-schema.scanner";

export interface DataFilterConfig {
    imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
    deserializer?: Provider;
    accessControlAdapter?: Provider;
    translateAdapter?: Provider;
    exportAdapter?: Provider;
    filter?: FilterOptionConfig;
}

export interface DataFilterFeatureConfig extends DataFilterConfig {
    filters: {
        filter: Type<BaseFilter<any>>,
        inject?: any[],
        disableAccessControl?: boolean
    }[];
}

@Global()
@Module({
    providers: [DataFilterScanner, MongoSchemaScanner, DataFilterService],
    exports: [DataFilterScanner, MongoSchemaScanner, DataFilterService]
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
            },
            filter: {
                ...defaultFilterOptionConfig,
                ...(option?.filter ?? {})
            }
        };
        return {
            module: DataFilterModule,
            imports: [...option.imports],
            providers: [
                {
                    provide: FILTER_OPTION,
                    useValue: option.filter
                },
                option.deserializer,
                option.accessControlAdapter,
                option.translateAdapter,
                option.exportAdapter
            ],
            exports: [
                FILTER_OPTION,
                UserDeserializer,
                AccessControlAdapter,
                TranslateAdapter,
                ExportAdapter
            ]
        };
    }

    public static forFeature(option: DataFilterFeatureConfig): DynamicModule {
        const providerOverride = Object.keys(option).map(x => {
            if (x === "imports" || x === "filters") {
                return;
            }
            return option[x];
        }).filter(x => x);
        return {
            module: DataFilterModule,
            imports: option.imports ?? [],
            providers: [
                ...providerOverride,
                ...option.filters.flatMap(x => ([
                    {
                        provide: x.filter,
                        useFactory: FilterFactory(x.filter),
                        inject: x.inject ?? []
                    },
                    createFilterProvider(x.filter, x.disableAccessControl)
                ]))
            ],
            exports: [
                ...option.filters.map(x => FilterUtils.getProviderToken(x.filter))
            ]
        };
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

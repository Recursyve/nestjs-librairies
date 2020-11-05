import { DynamicModule, ForwardReference, Global, Module, Provider, Type } from "@nestjs/common";
import {
    AccessControlAdapter,
    DataFilterService,
    DefaultAccessControlAdapter,
    DefaultDeserializer, DefaultExportAdapter, DefaultTranslateAdapter, ExportAdapter, FilterUtils, TranslateAdapter,
    UserDeserializer
} from "../../data-filter/lib";
import { FILTER_OPTION } from "../../data-filter/lib/constant";
import { BaseFilter } from "../../data-filter/lib/filter";
import { defaultFilterOptionConfig, FilterOptionConfig } from "../../data-filter/lib/filter/filter.config";
import { FilterFactory } from "../../data-filter/lib/filter/filter.factory";
import { createFilterProvider } from "../../data-filter/lib/filter/filter.provider";
import { DataFilterScanner } from "../../data-filter/lib/scanners/data-filter.scanner";
import { SequelizeModelScanner } from "../../data-filter/lib/scanners/sequelize-model.scanner";

export interface DataFilterConfig {
    imports?: Array<Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
    deserializer?: Provider;
    accessControlAdapter?: Provider;
    translateAdapter?: Provider;
    exportAdapter?: Provider;
    filter?: FilterOptionConfig;
}

export interface DataFilterFeatureConfig extends DataFilterConfig {
    filters: { filter: Type<BaseFilter<any>>; inject?: any[] }[];
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
                    createFilterProvider(x.filter)
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

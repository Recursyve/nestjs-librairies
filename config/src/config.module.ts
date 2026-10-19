import type { DynamicModule, Provider, Type } from "@nestjs/common";
import { Global, Module } from "@nestjs/common";
import { isPlainObject } from "@nestjs/common/utils/shared.utils";

import type { ConfigModuleOptions } from "./config.module.options";
import { ConfigUtils } from "./config.utils";
import { OPTIONS } from "./constant";
import { ConfigProviderHandler } from "./handlers/config-provider.handler";
import { ConfigHandler } from "./handlers/config.handler";
import { EnvironmentConfigProvider } from "./providers/environment.config-provider";
import { ConfigTransformerService } from "./services/config-transformer.service";

@Global()
@Module({
    providers: [EnvironmentConfigProvider, ConfigTransformerService],
    exports: [ConfigTransformerService]
})
export class ConfigModule {
    public static forRoot(...configs: Type[]): DynamicModule;

    public static forRoot(options: ConfigModuleOptions): DynamicModule;

    public static forRoot(optionsOrConfig?: ConfigModuleOptions | Type, ...configs: Type[]): DynamicModule {
        const options = resolveForRootOptions(optionsOrConfig, ...configs);
        const configTypes = options.configs ?? [];

        return {
            module: ConfigModule,
            global: true,
            providers: [
                ...configTypes.map((config) => createConfigProvider(config)),
                {
                    provide: OPTIONS,
                    useValue: options
                }
            ],
            exports: [...configTypes.map((config) => ConfigUtils.getProviderToken(config)), OPTIONS]
        };
    }

    public static forFeature(...configs: Type[]): DynamicModule {
        return {
            module: ConfigModule,
            providers: configs.map((config) => createConfigProvider(config)),
            exports: configs.map((config) => ConfigUtils.getProviderToken(config))
        };
    }
}

function resolveForRootOptions(optionsOrConfig?: ConfigModuleOptions | Type, ...configs: Type[]): ConfigModuleOptions {
    if (optionsOrConfig === undefined) {
        return { configs };
    }

    if (configs.length === 0 && isPlainObject(optionsOrConfig)) {
        return optionsOrConfig as ConfigModuleOptions;
    }

    return { configs: [optionsOrConfig as Type, ...configs] };
}

export const createConfigProvider = (target: Type): Provider => {
    const config = ConfigHandler.getConfig(target);

    return {
        provide: ConfigUtils.getProviderToken(target),
        useFactory: async (configTransformerService: ConfigTransformerService) => {
            return configTransformerService.transform<unknown>(target);
        },
        inject: [
            ConfigTransformerService,
            ConfigProviderHandler.getConfigProvider(config.provider ?? EnvironmentConfigProvider.type)
        ]
    };
};

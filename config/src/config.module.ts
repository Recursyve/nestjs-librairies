import { DynamicModule, Global, Module, Provider, Type } from "@nestjs/common";
import { ConfigTransformerService } from "./services/config-transformer.service";
import { ConfigUtils } from "./config.utils";
import { EnvironmentConfigProvider } from "./providers/environment.config-provider";
import { ConfigExplorerService } from "./services/config-explorer.service";
import { ConfigProvidersRegistry } from "./services/config-providers.registry";
import { ModuleRef } from "@nestjs/core";

@Global()
@Module({
    providers: [EnvironmentConfigProvider, ConfigTransformerService, ConfigExplorerService, ConfigProvidersRegistry],
})
export class ConfigModule {
    public static forRoot(...configs: Type[]): DynamicModule {
        return {
            module: ConfigModule,
            global: true,
            providers: configs.map((config) => createConfigProvider(config)),
            exports: configs.map((config) => ConfigUtils.getProviderToken(config)),
        };
    }

    public static forFeature(...configs: Type[]): DynamicModule {
        return {
            module: ConfigModule,
            providers: configs.map((config) => createConfigProvider(config)),
            exports: configs.map((config) => ConfigUtils.getProviderToken(config)),
        };
    }
}

export const createConfigProvider = (target: Type): Provider => {
    return {
        provide: ConfigUtils.getProviderToken(target),
        useFactory: (configTransformerService: ConfigTransformerService) => configTransformerService.transform(target),
        inject: [ConfigTransformerService, ModuleRef],
    };
};

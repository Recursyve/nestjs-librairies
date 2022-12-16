import { DynamicModule, Global, Module, OnModuleInit, Provider, Type } from "@nestjs/common";
import { ConfigTransformerService } from "./services/config-transformer.service";
import { VariableScanner } from "./scanners/variable.scanner";
import { ConfigUtils } from "./config.utils";
import { ConfigHandler } from "./handlers/config.handler";
import { configFactory } from "./config.factory";
import { EnvironmentConfigProvider } from "./providers/environment.config-provider";
import { ConfigExplorerService } from "./services/config-explorer.service";
import { ConfigProvidersRegistry } from "./services/config-providers.registry";

@Global()
@Module({
    providers: [
        VariableScanner,
        ConfigTransformerService,
        ConfigExplorerService,
        ConfigProvidersRegistry
    ]
})
export class ConfigModule implements OnModuleInit {
    constructor(private explorer: ConfigExplorerService, private configProvidersRegistry: ConfigProvidersRegistry) {}

    public static forRoot(...configs: Type[]): DynamicModule {
        return {
            module: ConfigModule,
            global: true,
            providers: [
                EnvironmentConfigProvider,
                ...configs.map((config) => createConfigProvider(config))
            ],
            exports: configs.map((config) => ConfigUtils.getProviderToken(config))
        };
    }

    public static forFeature(...configs: Type[]): DynamicModule {
        return {
            module: ConfigModule,
            providers: configs.map((config) => createConfigProvider(config)),
            exports: configs.map((config) => ConfigUtils.getProviderToken(config))
        };
    }

    public onModuleInit(): void {
        const configProviders = this.explorer.exploreConfigProviders();
        this.configProvidersRegistry.registerConfigProviders(configProviders);
    }
}

export const createConfigProvider = (target: Type): Provider => {
    const config = ConfigHandler.getConfig(target);

    console.log(config);

    return {
        provide: ConfigUtils.getProviderToken(target),
        useFactory: configFactory(target),
        inject: [ConfigTransformerService, ConfigProvidersRegistry]
    };
};

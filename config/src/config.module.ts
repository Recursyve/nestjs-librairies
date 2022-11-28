import { DynamicModule, Global, Module, Provider, Type } from "@nestjs/common";
import { ConfigTransformerService } from "./services/config-transformer.service";
import { VariableScanner } from "./scanners/variable.scanner";
import { ConfigUtils } from "./config.utils";
import { ConfigHandler } from "./handlers/config.handler";
import { configFactory } from "./config.factory";
import { EnvironmentConfigProvider } from "./providers/environment.config-provider";
import { ConfigProvider } from "./providers/config-provider";

@Global()
@Module({
    providers: [
        VariableScanner,
        ConfigTransformerService
    ]
})
export class ConfigModule {
    public static forRoot(...configs: Type[]): DynamicModule {
        return {
            module: ConfigModule,
            global: true,
            providers: [
                EnvironmentConfigProvider,
                {
                    provide: ConfigProvider,
                    useClass: EnvironmentConfigProvider
                },
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
}

export const createConfigProvider = (target: Type): Provider => {
    const config = ConfigHandler.getConfig(target);

    console.log(config);

    return {
        provide: ConfigUtils.getProviderToken(target),
        useFactory: configFactory(target),
        inject: [ConfigTransformerService, config.provider ?? EnvironmentConfigProvider]
    };
};

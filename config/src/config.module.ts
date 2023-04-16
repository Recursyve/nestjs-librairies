import { DynamicModule, Global, Module, Provider, Type } from "@nestjs/common";
import { ConfigTransformerService } from "./services/config-transformer.service";
import { ConfigUtils } from "./config.utils";
import { EnvironmentConfigProvider } from "./providers/environment.config-provider";
import { ConfigProviderHandler } from "./handlers/config-provider.handler";
import { ConfigHandler } from "./handlers/config.handler";
import { OPTIONS } from "./constant";
import { isPlainObject } from "@nestjs/common/utils/shared.utils";

export interface ConfigModuleOptions {
    configs?: Type[];
    skipRequiredFieldsCheck?: boolean;
}

@Global()
@Module({
    providers: [EnvironmentConfigProvider, ConfigTransformerService]
})
export class ConfigModule {
    public static forRoot(...configs: Type[]): DynamicModule;
    public static forRoot(options?: ConfigModuleOptions): DynamicModule;
    public static forRoot(...args: any[]): DynamicModule {
        let options: ConfigModuleOptions;

        if (args.length === 1 && isPlainObject(args[0])) {
            options = args[0];
        } else {
            options = {
                configs: args
            };
        }

        return {
            module: ConfigModule,
            global: true,
            providers: [
                ...(options?.configs?.map((config) => createConfigProvider(config)) ?? []),
                {
                    provide: OPTIONS,
                    useValue: options
                }
            ],
            exports: [...(options?.configs?.map((config) => ConfigUtils.getProviderToken(config)) ?? []), OPTIONS]
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

    return {
        provide: ConfigUtils.getProviderToken(target),
        useFactory: (configTransformerService: ConfigTransformerService) => configTransformerService.transform(target),
        inject: [
            ConfigTransformerService,
            ConfigProviderHandler.getConfigProvider(config?.provider ?? EnvironmentConfigProvider.type)
        ]
    };
};

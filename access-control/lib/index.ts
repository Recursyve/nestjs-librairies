import { DynamicModule, Global, Module, Provider, Type } from "@nestjs/common";
import { ModuleMetadata } from "@nestjs/common/interfaces";
import { APP_GUARD } from "@nestjs/core";
import { AccessControlCoreModule } from "./access-control-core.module";
import { ACCESS_CONTROL_MODELS } from "./constant";
import { AccessControlGuard } from "./guards";
import { AccessControlModelsFactory } from "./interfaces";
import { M } from "./utils";
import { DefaultDeserializer, UserDeserializer } from "./deserializers";

export interface AccessControlConfig extends Pick<ModuleMetadata, 'imports'> {
    deserializer?: Provider;
}

export interface AccessControlAsyncConfig extends AccessControlConfig {
    useExisting?: Type<AccessControlModelsFactory>;
    useClass?: Type<AccessControlModelsFactory>;
}

@Global()
@Module({})
export class AccessControlModule {
    public static forRoot(models: (typeof M)[], option?: AccessControlConfig): DynamicModule {
        option = {
            imports: option?.imports ?? [],
            deserializer: option?.deserializer ?? {
                provide: UserDeserializer,
                useClass: DefaultDeserializer
            }
        };
        return {
            module: AccessControlModule,
            imports: [AccessControlCoreModule, ...option.imports],
            providers: [
                option.deserializer,
                {
                    provide: ACCESS_CONTROL_MODELS,
                    useValue: models
                },
                {
                    provide: APP_GUARD,
                    useClass: AccessControlGuard
                }
            ],
            exports: [UserDeserializer]
        };
    }

    public static forRootAsync(option?: AccessControlAsyncConfig): DynamicModule {
        option = {
            imports: option?.imports ?? [],
            deserializer: option?.deserializer ?? {
                provide: UserDeserializer,
                useClass: DefaultDeserializer
            },
            useClass: option?.useClass,
            useExisting: option?.useExisting,
        };
        return {
            module: AccessControlModule,
            imports: [AccessControlCoreModule, ...option.imports],
            providers: [
                option.deserializer,
                option.useClass || option.useExisting,
                {
                    provide: ACCESS_CONTROL_MODELS,
                    useFactory: async (factory: AccessControlModelsFactory) => {
                        return factory.getModels();
                    },
                    inject: [option.useClass || option.useExisting]
                },
                {
                    provide: APP_GUARD,
                    useClass: AccessControlGuard
                }
            ],
            exports: [UserDeserializer]
        };
    }
}

export * from "./commands";
export * from "./decorators";
export * from "./deserializers";
export * from "./events";
export * from "./guards";
export * from "./interfaces";
export * from "./models";
export * from "./policies";
export * from "./services";
export * from "./utils";

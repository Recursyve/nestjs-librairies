import { DynamicModule, Global, Module, Provider, Type } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AccessControlCoreModule } from "./access-control-core.module";
import { ACCESS_CONTROL_MODELS } from "./constant";
import { AccessControlGuard } from "./guards";
import { M } from "./utils";
import { DefaultDeserializer, UserDeserializer } from "./deserializers";

export interface AccessControlConfig {
    imports?: Type<any>[];
    deserializer?: Provider;
}

@Global()
@Module({})
export class AccessControlModule {
    public static forRoot(models: (typeof M)[], option?: AccessControlConfig): DynamicModule {
        option = {
            imports: option?.imports ? option.imports : [],
            deserializer: option?.deserializer ? option.deserializer : {
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
}

export * from "./commands";
export * from "./decorators";
export * from "./deserializers";
export * from "./events";
export * from "./guards";
export * from "./models";
export * from "./policies";
export * from "./services";
export * from "./utils";

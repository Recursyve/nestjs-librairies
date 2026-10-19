import type { DynamicModule, ModuleMetadata, Provider } from "@nestjs/common";
import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { AccessControlCoreModule } from "./access-control-core.module";
import { ACCESS_CONTROL_DEFAULT_DATABASE } from "./constant";
import { DefaultDeserializer } from "./deserializers/default.deserializer";
import { UserDeserializer } from "./deserializers/user.deserializer";
import { AccessControlGuard } from "./guards/access-control.guard";
import { DatabaseAdaptersRegistry } from "./services/database-adapters.registry";

export interface AccessControlConfig extends Pick<ModuleMetadata, "imports"> {
    deserializer?: Provider;
    defaultDatabaseType?: string;
}

@Global()
@Module({})
export class AccessControlModule {
    public static forRoot(option: AccessControlConfig): DynamicModule {
        return {
            module: AccessControlModule,
            imports: [AccessControlCoreModule, ...(option.imports ?? [])],
            providers: [
                option.deserializer ?? { provide: UserDeserializer, useClass: DefaultDeserializer },
                DatabaseAdaptersRegistry,
                {
                    provide: ACCESS_CONTROL_DEFAULT_DATABASE,
                    useValue: option.defaultDatabaseType ?? null
                },
                {
                    provide: APP_GUARD,
                    useClass: AccessControlGuard
                }
            ],
            exports: [UserDeserializer, DatabaseAdaptersRegistry, ACCESS_CONTROL_DEFAULT_DATABASE]
        };
    }
}

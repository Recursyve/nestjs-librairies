import { DynamicModule, Module } from "@nestjs/common";
import { MongooseDatabaseAdapter } from "./adapters/database.adapter";

@Module({})
export class AccessControlMongooseModule {
    public static forRoot(): DynamicModule {
        return {
            module: AccessControlMongooseModule,
            providers: [MongooseDatabaseAdapter]
        }
    };
}

export * from "./adapters/database.adapter";
export * from "./decorators";
export * from "./plugins/access-control.plugin";

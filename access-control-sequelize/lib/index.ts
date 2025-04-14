import { DynamicModule, Module } from "@nestjs/common";
import { SequelizeDatabaseAdapter } from "./adapters/database.adapter";
import { SequelizeHooksAccessControlModule } from "./hooks/sequelize-hooks.module";
import { SequelizeAccessControlFindOptionsGenerator } from "./providers/find-options.generator";

@Module({
    imports: [SequelizeHooksAccessControlModule]
})
export class AccessControlSequelizeModule {
    public static forRoot(): DynamicModule {
        return {
            module: AccessControlSequelizeModule,
            global: true,
            providers: [SequelizeDatabaseAdapter, SequelizeAccessControlFindOptionsGenerator],
            exports: [SequelizeAccessControlFindOptionsGenerator]
        };
    };
}

export * from "./adapters/database.adapter";
export * from "./decorators";
export * from "./hooks/sequelize-hooks.module";
export * from "./providers/find-options.generator";
export * from "./repositories/repositories";
export * from "./utils/where-option-generator";

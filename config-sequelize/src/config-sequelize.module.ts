import type { DynamicModule } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";

import { createSequelizeModel } from "./models/config-sequelize.model";
import { SequelizeConfigProvider } from "./providers/sequelize.config-provider";

export interface ConfigSequelizeOptions {
    tableName?: string;
}

@Module({})
export class ConfigSequelizeModule {
    public static forRoot(options?: ConfigSequelizeOptions): DynamicModule {
        return {
            module: ConfigSequelizeModule,
            global: true,
            imports: [SequelizeModule.forFeature([createSequelizeModel(options?.tableName)])],
            providers: [SequelizeConfigProvider],
            exports: [SequelizeConfigProvider]
        };
    }
}

import { DynamicModule, Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { SequelizeConfigProvider } from "./providers/sequelize.config-provider";
import { createSequelizeModel } from "./models/config-sequelize.model";

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

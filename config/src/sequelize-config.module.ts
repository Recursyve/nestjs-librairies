import { DynamicModule } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { SequelizeConfigsModel } from "./models/sequelize-configs.model";
import { SequelizeConfigProvider } from "./providers/sequelize.config-provider";

export class SequelizeConfigModule {
    public static forRoot(): DynamicModule {
        return {
            module: SequelizeConfigModule,
            global: true,
            imports: [
                SequelizeModule.forFeature([
                    SequelizeConfigsModel
                ]),
            ],
            providers: [SequelizeConfigProvider],
            exports: [SequelizeConfigProvider]
        };
    }
}

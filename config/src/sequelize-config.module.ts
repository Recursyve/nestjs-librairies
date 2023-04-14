import { Global, Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { SequelizeConfigsModel } from "./models/sequelize-configs.model";
import { SequelizeConfigProvider } from "./providers/sequelize.config-provider";

@Module({
    imports: [SequelizeModule.forFeature([SequelizeConfigsModel])],
    providers: [SequelizeConfigProvider],
    exports: [SequelizeConfigProvider],
})
@Global()
export class SequelizeConfigModule {}

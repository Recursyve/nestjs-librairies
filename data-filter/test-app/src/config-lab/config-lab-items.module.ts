import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { ConfigLabItemsController } from "./controllers/config-lab-items.controller";
import { ConfigLabItemsFilter } from "./filters/config-lab-items.filter";
import { ConfigLabItems } from "./models/config-lab-items.model";

@Module({
    imports: [
        SequelizeModule.forFeature([ConfigLabItems]),
        DataFilterModule.forFeature({
            filters: [{ filter: ConfigLabItemsFilter }]
        })
    ],
    controllers: [ConfigLabItemsController]
})
export class ConfigLabItemsModule {}

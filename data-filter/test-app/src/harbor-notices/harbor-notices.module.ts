import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { HarborNoticesController } from "./controllers/harbor-notices.controller";
import { HarborNoticesFilter } from "./filters/harbor-notices.filter";
import { HarborNotices } from "./models/harbor-notices.model";

@Module({
    imports: [
        SequelizeModule.forFeature([HarborNotices]),
        DataFilterModule.forFeature({
            filters: [{ filter: HarborNoticesFilter }]
        })
    ],
    controllers: [HarborNoticesController]
})
export class HarborNoticesModule {}

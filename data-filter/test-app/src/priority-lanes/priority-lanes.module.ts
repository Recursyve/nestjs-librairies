import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { PriorityLanesController } from "./controllers/priority-lanes.controller";
import { PriorityLanesFilter } from "./filters/priority-lanes.filter";
import { PriorityLanes } from "./models/priority-lanes.model";

@Module({
    imports: [
        SequelizeModule.forFeature([PriorityLanes]),
        DataFilterModule.forFeature({
            filters: [{ filter: PriorityLanesFilter }]
        })
    ],
    controllers: [PriorityLanesController]
})
export class PriorityLanesModule {}

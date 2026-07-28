import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { GroupLabController } from "./controllers/group-lab.controller";
import { GroupLabFilter } from "./filters/group-lab.filter";
import { GroupLabEntries } from "./models/group-lab-entries.model";

@Module({
    imports: [
        SequelizeModule.forFeature([GroupLabEntries]),
        DataFilterModule.forFeature({
            filters: [{ filter: GroupLabFilter }]
        })
    ],
    controllers: [GroupLabController]
})
export class GroupLabModule {}

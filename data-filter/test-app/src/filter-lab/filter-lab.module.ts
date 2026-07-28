import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { FilterLabController } from "./controllers/filter-lab.controller";
import { FilterLabFilter } from "./filters/filter-lab.filter";
import { FilterLabRows } from "./models/filter-lab-rows.model";

@Module({
    imports: [
        SequelizeModule.forFeature([FilterLabRows]),
        DataFilterModule.forFeature({
            filters: [{ filter: FilterLabFilter }]
        })
    ],
    controllers: [FilterLabController]
})
export class FilterLabModule {}

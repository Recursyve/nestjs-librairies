import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { ExportLabController } from "./controllers/export-lab.controller";
import { ExportLabFilter } from "./filters/export-lab.filter";
import { ExportLabRows } from "./models/export-lab-rows.model";

@Module({
    imports: [
        SequelizeModule.forFeature([ExportLabRows]),
        DataFilterModule.forFeature({
            filters: [{ filter: ExportLabFilter }]
        })
    ],
    controllers: [ExportLabController]
})
export class ExportLabModule {}

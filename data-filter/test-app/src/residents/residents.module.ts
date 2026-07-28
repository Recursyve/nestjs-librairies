import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { ResidentsController } from "./controllers/residents.controller";
import { ResidentsFilter } from "./filters/residents.filter";
import { Residents } from "./models/residents.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Residents]),
        DataFilterModule.forFeature({
            filters: [{ filter: ResidentsFilter }]
        })
    ],
    controllers: [ResidentsController]
})
export class ResidentsModule {}

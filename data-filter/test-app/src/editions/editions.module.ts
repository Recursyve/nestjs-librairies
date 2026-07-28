import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { EditionsController } from "./controllers/editions.controller";
import { EditionsFilter } from "./filters/editions.filter";
import { Editions } from "./models/editions.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Editions]),
        DataFilterModule.forFeature({
            filters: [{ filter: EditionsFilter }]
        })
    ],
    controllers: [EditionsController]
})
export class EditionsModule {}

import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { CargoBillsController } from "./controllers/cargo-bills.controller";
import { CargoBillsFilter } from "./filters/cargo-bills.filter";
import { CargoBills } from "./models/cargo-bills.model";

@Module({
    imports: [
        SequelizeModule.forFeature([CargoBills]),
        DataFilterModule.forFeature({
            filters: [{ filter: CargoBillsFilter }]
        })
    ],
    controllers: [CargoBillsController]
})
export class CargoBillsModule {}

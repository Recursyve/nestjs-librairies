import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { ContractsController } from "./controllers/contracts.controller";
import { ContractsFilter } from "./filters/contracts.filter";
import { Contracts } from "./models/contracts.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Contracts]),
        DataFilterModule.forFeature({
            filters: [{ filter: ContractsFilter }]
        })
    ],
    controllers: [ContractsController]
})
export class ContractsModule {}

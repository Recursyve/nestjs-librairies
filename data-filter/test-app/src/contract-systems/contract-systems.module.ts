import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { ContractSystemsController } from "./contract-systems.controller";
import { ContractSystemsFilter } from "./filters/contract-systems.filter";
import { ContractSystems } from "./models/contract-systems.model";

@Module({
    imports: [
        SequelizeModule.forFeature([ContractSystems]),
        DataFilterModule.forFeature({
            filters: [{ filter: ContractSystemsFilter }]
        })
    ],
    controllers: [ContractSystemsController]
})
export class ContractSystemsModule {}

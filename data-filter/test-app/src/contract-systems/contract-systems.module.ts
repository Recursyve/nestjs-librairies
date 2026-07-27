import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { ContractSystems } from "./models/contract-systems.model";

@Module({
    imports: [SequelizeModule.forFeature([ContractSystems])]
})
export class ContractSystemsModule {}

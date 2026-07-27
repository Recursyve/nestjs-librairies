import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Contracts } from "./models/contracts.model";

@Module({
    imports: [SequelizeModule.forFeature([Contracts])]
})
export class ContractsModule {}

import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Visits } from "./models/visits.model";

@Module({
    imports: [SequelizeModule.forFeature([Visits])]
})
export class VisitsModule {}

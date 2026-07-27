import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { MaintenanceVisits } from "./models/maintenance-visits.model";

@Module({
    imports: [SequelizeModule.forFeature([MaintenanceVisits])]
})
export class MaintenanceVisitsModule {}

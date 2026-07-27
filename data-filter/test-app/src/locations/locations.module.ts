import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Locations } from "./models/locations.model";

@Module({
    imports: [SequelizeModule.forFeature([Locations])]
})
export class LocationsModule {}

import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { LocationsController } from "./controllers/locations.controller";
import { LocationsFilter } from "./filters/locations.filter";
import { Locations } from "./models/locations.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Locations]),
        DataFilterModule.forFeature({
            filters: [{ filter: LocationsFilter }]
        })
    ],
    controllers: [LocationsController]
})
export class LocationsModule {}

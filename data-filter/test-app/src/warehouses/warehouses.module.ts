import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { WarehousesController } from "./controllers/warehouses.controller";
import { WarehousesFilter } from "./filters/warehouses.filter";
import { Warehouses } from "./models/warehouses.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Warehouses]),
        DataFilterModule.forFeature({
            filters: [{ filter: WarehousesFilter }]
        })
    ],
    controllers: [WarehousesController]
})
export class WarehousesModule {}

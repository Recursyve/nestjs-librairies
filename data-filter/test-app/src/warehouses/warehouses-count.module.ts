import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import {
    WarehousesCountController,
    WarehousesRootCountController
} from "./controllers/warehouses-count.controller";
import { WarehousesCountFilter, WarehousesRootCountFilter } from "./filters/warehouses-count.filter";
import { Warehouses } from "./models/warehouses.model";

/**
 * @Count on a nested path. Kept out of AppModule so validateData stays quiet,
 * mirroring the WarehousesSumData setup.
 */
@Module({
    imports: [
        SequelizeModule.forFeature([Warehouses]),
        DataFilterModule.forFeature({
            filters: [{ filter: WarehousesCountFilter }, { filter: WarehousesRootCountFilter }]
        })
    ],
    controllers: [WarehousesCountController, WarehousesRootCountController]
})
export class WarehousesCountModule {}

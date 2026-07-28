import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { OrderLabController } from "./controllers/order-lab.controller";
import { OrderLabFilter } from "./filters/order-lab.filter";
import { OrderLabRows } from "./models/order-lab-rows.model";

@Module({
    imports: [
        SequelizeModule.forFeature([OrderLabRows]),
        DataFilterModule.forFeature({
            filters: [{ filter: OrderLabFilter }]
        })
    ],
    controllers: [OrderLabController]
})
export class OrderLabModule {}

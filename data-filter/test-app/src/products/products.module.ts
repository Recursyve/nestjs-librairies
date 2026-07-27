import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "../../../dist";
import { ProductsController } from "./controllers/products.controller";
import { ProductsFilter } from "./filters/products.filter";
import { Products } from "./models/products.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Products]),
        DataFilterModule.forFeature({
            filters: [{ filter: ProductsFilter }]
        })
    ],
    controllers: [ProductsController]
})
export class ProductsModule {}

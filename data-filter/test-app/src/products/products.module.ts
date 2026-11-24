import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Products } from "./models/products.model";

@Module({
    imports: [SequelizeModule.forFeature([Products])]
})
export class ProductsModule {}

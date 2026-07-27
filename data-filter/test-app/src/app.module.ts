import { Module } from "@nestjs/common";
import { ContractsModule } from "./contracts/contracts.module";
import { ProductsModule } from "./products/products.module";

@Module({
    imports: [ContractsModule, ProductsModule],
    controllers: [],
    providers: []
})
export class AppModule {}

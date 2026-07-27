import { Module } from "@nestjs/common";
import { ContractsModule } from "./contracts/contracts.module";
import { CoordsModule } from "./coords/coords.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { ProductsModule } from "./products/products.module";
import { VisitsModule } from "./visits/visits.module";

@Module({
    imports: [ContractsModule, CoordsModule, InvoicesModule, ProductsModule, VisitsModule],
    controllers: [],
    providers: []
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { ContractsModule } from "./contracts/contracts.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { ProductsModule } from "./products/products.module";
import { VisitsModule } from "./visits/visits.module";

@Module({
    imports: [ContractsModule, InvoicesModule, ProductsModule, VisitsModule],
    controllers: [],
    providers: []
})
export class AppModule {}

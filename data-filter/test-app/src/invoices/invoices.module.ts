import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { InvoicesController } from "./controllers/invoices.controller";
import { InvoicesFilter } from "./filters/invoices.filter";
import { Invoices } from "./models/invoices.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Invoices]),
        DataFilterModule.forFeature({
            filters: [{ filter: InvoicesFilter, disableAccessControl: true }]
        })
    ],
    controllers: [InvoicesController]
})
export class InvoicesModule {}

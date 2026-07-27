import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Invoices } from "./models/invoices.model";

@Module({
    imports: [SequelizeModule.forFeature([Invoices])]
})
export class InvoicesModule {}

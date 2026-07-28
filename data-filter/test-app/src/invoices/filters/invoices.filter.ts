import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, Exports, TextFilter } from "@recursyve/nestjs-data-filter";
import { Invoices } from "../models/invoices.model";

@Data(Invoices)
@Attributes(["invoice_number", "paid", "subtotal", "total_cost"])
@Exports(["invoice_number", "total_cost"])
export class InvoicesData {}

@Injectable()
export class InvoicesFilter extends BaseFilter<InvoicesData> {
    public readonly dataDefinition = InvoicesData;

    public readonly invoiceNumber = new TextFilter({ attribute: "invoice_number" });
}

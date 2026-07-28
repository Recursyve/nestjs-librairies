import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { InvoicesData, InvoicesFilter } from "../filters/invoices.filter";

@Controller("invoices")
export class InvoicesController extends FilterController<InvoicesData> {
    constructor(@InjectFilter(InvoicesFilter) filterService: FilterService<InvoicesData>) {
        super(filterService);
    }
}

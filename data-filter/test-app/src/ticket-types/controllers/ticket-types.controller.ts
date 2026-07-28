import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { TicketTypesData, TicketTypesFilter } from "../filters/ticket-types.filter";

@Controller("ticket-types")
export class TicketTypesController extends FilterController<TicketTypesData> {
    constructor(@InjectFilter(TicketTypesFilter) filterService: FilterService<TicketTypesData>) {
        super(filterService);
    }
}

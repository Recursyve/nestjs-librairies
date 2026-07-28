import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { OrderLabData, OrderLabFilter } from "../filters/order-lab.filter";

@Controller("order-lab")
export class OrderLabController extends FilterController<OrderLabData> {
    constructor(@InjectFilter(OrderLabFilter) filterService: FilterService<OrderLabData>) {
        super(filterService);
    }
}

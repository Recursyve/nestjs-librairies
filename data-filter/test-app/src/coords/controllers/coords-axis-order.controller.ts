import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { CoordsAxisOrderData, CoordsAxisOrderFilter } from "../filters/coords-axis-order.filter";

@Controller("coords-axis-order")
export class CoordsAxisOrderController extends FilterController<CoordsAxisOrderData> {
    constructor(@InjectFilter(CoordsAxisOrderFilter) filterService: FilterService<CoordsAxisOrderData>) {
        super(filterService);
    }
}

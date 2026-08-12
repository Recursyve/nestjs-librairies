import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { WarehousesCountData, WarehousesRootCountData } from "../filters/warehouses-count.data";
import { WarehousesCountFilter, WarehousesRootCountFilter } from "../filters/warehouses-count.filter";

@Controller("warehouses-count")
export class WarehousesCountController extends FilterController<WarehousesCountData> {
    constructor(@InjectFilter(WarehousesCountFilter) filterService: FilterService<WarehousesCountData>) {
        super(filterService);
    }
}

@Controller("warehouses-root-count")
export class WarehousesRootCountController extends FilterController<WarehousesRootCountData> {
    constructor(@InjectFilter(WarehousesRootCountFilter) filterService: FilterService<WarehousesRootCountData>) {
        super(filterService);
    }
}

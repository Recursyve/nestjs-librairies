import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { WarehousesData, WarehousesFilter } from "../filters/warehouses.filter";

@Controller("warehouses")
export class WarehousesController extends FilterController<WarehousesData> {
    constructor(@InjectFilter(WarehousesFilter) filterService: FilterService<WarehousesData>) {
        super(filterService);
    }
}

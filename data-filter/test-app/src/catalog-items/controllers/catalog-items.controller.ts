import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { CatalogItemsData, CatalogItemsFilter } from "../filters/catalog-items.filter";

@Controller("catalog-items")
export class CatalogItemsController extends FilterController<CatalogItemsData> {
    constructor(@InjectFilter(CatalogItemsFilter) filterService: FilterService<CatalogItemsData>) {
        super(filterService);
    }
}

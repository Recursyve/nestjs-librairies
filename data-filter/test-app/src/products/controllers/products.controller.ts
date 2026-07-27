import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { ProductsData, ProductsFilter } from "../filters/products.filter";

@Controller("products")
export class ProductsController extends FilterController<ProductsData> {
    constructor(@InjectFilter(ProductsFilter) filterService: FilterService<ProductsData>) {
        super(filterService);
    }
}

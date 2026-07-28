import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { EditionsData, EditionsFilter } from "../filters/editions.filter";

@Controller("editions")
export class EditionsController extends FilterController<EditionsData> {
    constructor(@InjectFilter(EditionsFilter) filterService: FilterService<EditionsData>) {
        super(filterService);
    }
}

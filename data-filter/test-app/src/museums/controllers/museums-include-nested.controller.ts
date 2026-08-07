import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { MuseumsIncludeNestedData, MuseumsIncludeNestedFilter } from "../filters/museums-include-nested.filter";

@Controller("museums-include-nested")
export class MuseumsIncludeNestedController extends FilterController<MuseumsIncludeNestedData> {
    constructor(@InjectFilter(MuseumsIncludeNestedFilter) filterService: FilterService<MuseumsIncludeNestedData>) {
        super(filterService);
    }
}

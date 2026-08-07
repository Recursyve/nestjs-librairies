import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { MuseumsIncludeSeparateData, MuseumsIncludeSeparateFilter } from "../filters/museums-include-separate.filter";

@Controller("museums-include-separate")
export class MuseumsIncludeSeparateController extends FilterController<MuseumsIncludeSeparateData> {
    constructor(@InjectFilter(MuseumsIncludeSeparateFilter) filterService: FilterService<MuseumsIncludeSeparateData>) {
        super(filterService);
    }
}

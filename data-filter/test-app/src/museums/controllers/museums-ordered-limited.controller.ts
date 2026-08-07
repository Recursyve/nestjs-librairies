import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { MuseumsOrderedLimitedData, MuseumsOrderedLimitedFilter } from "../filters/museums-ordered-limited.filter";

@Controller("museums-ordered-limited")
export class MuseumsOrderedLimitedController extends FilterController<MuseumsOrderedLimitedData> {
    constructor(@InjectFilter(MuseumsOrderedLimitedFilter) filterService: FilterService<MuseumsOrderedLimitedData>) {
        super(filterService);
    }
}

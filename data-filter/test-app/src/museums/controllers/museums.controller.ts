import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { MuseumsDisplayedData, MuseumsFilter } from "../filters/museums.filter";

@Controller("museums")
export class MuseumsController extends FilterController<MuseumsDisplayedData> {
    constructor(@InjectFilter(MuseumsFilter) filterService: FilterService<MuseumsDisplayedData>) {
        super(filterService);
    }
}

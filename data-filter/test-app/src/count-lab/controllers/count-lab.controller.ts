import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { CountLabData, CountLabFilter } from "../filters/count-lab.filter";

@Controller("count-lab")
export class CountLabController extends FilterController<CountLabData> {
    constructor(@InjectFilter(CountLabFilter) filterService: FilterService<CountLabData>) {
        super(filterService);
    }
}

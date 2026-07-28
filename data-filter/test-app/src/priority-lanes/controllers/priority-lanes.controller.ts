import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { PriorityLanesData, PriorityLanesFilter } from "../filters/priority-lanes.filter";

@Controller("priority-lanes")
export class PriorityLanesController extends FilterController<PriorityLanesData> {
    constructor(@InjectFilter(PriorityLanesFilter) filterService: FilterService<PriorityLanesData>) {
        super(filterService);
    }
}

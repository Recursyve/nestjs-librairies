import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { RawEventsData, RawEventsFilter } from "../filters/raw-events.filter";

@Controller("raw-events")
export class RawEventsController extends FilterController<RawEventsData> {
    constructor(@InjectFilter(RawEventsFilter) filterService: FilterService<RawEventsData>) {
        super(filterService);
    }
}

import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { SubscribersData, SubscribersFilter } from "../filters/subscribers.filter";

@Controller("subscribers")
export class SubscribersController extends FilterController<SubscribersData> {
    constructor(@InjectFilter(SubscribersFilter) filterService: FilterService<SubscribersData>) {
        super(filterService);
    }
}

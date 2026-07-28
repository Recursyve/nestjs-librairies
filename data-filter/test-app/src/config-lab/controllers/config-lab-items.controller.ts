import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { ConfigLabItemsData, ConfigLabItemsFilter } from "../filters/config-lab-items.filter";

@Controller("config-lab-items")
export class ConfigLabItemsController extends FilterController<ConfigLabItemsData> {
    constructor(@InjectFilter(ConfigLabItemsFilter) filterService: FilterService<ConfigLabItemsData>) {
        super(filterService);
    }
}

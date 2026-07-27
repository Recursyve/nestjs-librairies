import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { SystemsData, SystemsFilter } from "../filters/systems.filter";

@Controller("systems")
export class SystemsController extends FilterController<SystemsData> {
    constructor(@InjectFilter(SystemsFilter) filterService: FilterService<SystemsData>) {
        super(filterService);
    }
}

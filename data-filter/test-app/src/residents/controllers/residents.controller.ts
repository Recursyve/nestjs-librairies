import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { ResidentsData, ResidentsFilter } from "../filters/residents.filter";

@Controller("residents")
export class ResidentsController extends FilterController<ResidentsData> {
    constructor(@InjectFilter(ResidentsFilter) filterService: FilterService<ResidentsData>) {
        super(filterService);
    }
}

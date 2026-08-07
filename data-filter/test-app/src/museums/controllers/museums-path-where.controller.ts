import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { MuseumsPathWhereData, MuseumsPathWhereFilter } from "../filters/museums-path-where.filter";

@Controller("museums-path-where")
export class MuseumsPathWhereController extends FilterController<MuseumsPathWhereData> {
    constructor(@InjectFilter(MuseumsPathWhereFilter) filterService: FilterService<MuseumsPathWhereData>) {
        super(filterService);
    }
}

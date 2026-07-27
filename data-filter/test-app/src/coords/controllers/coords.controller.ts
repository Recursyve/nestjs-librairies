import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { CoordsData, CoordsFilter } from "../filters/coords.filter";

@Controller("coords")
export class CoordsController extends FilterController<CoordsData> {
    constructor(@InjectFilter(CoordsFilter) filterService: FilterService<CoordsData>) {
        super(filterService);
    }
}

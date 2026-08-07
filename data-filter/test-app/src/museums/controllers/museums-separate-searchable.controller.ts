import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import {
    MuseumsSeparateSearchableData,
    MuseumsSeparateSearchableFilter
} from "../filters/museums-separate-searchable.filter";

@Controller("museums-separate-searchable")
export class MuseumsSeparateSearchableController extends FilterController<MuseumsSeparateSearchableData> {
    constructor(
        @InjectFilter(MuseumsSeparateSearchableFilter)
        filterService: FilterService<MuseumsSeparateSearchableData>
    ) {
        super(filterService);
    }
}

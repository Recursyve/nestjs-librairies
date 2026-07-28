import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { LocationsData, LocationsFilter } from "../filters/locations.filter";

@Controller("locations")
export class LocationsController extends FilterController<LocationsData> {
    constructor(@InjectFilter(LocationsFilter) filterService: FilterService<LocationsData>) {
        super(filterService);
    }
}

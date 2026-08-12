import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { MuseumsIncludeConfigData, MuseumsIncludeConfigFilter } from "../filters/museums-include-config.filter";

@Controller("museums-include-config")
export class MuseumsIncludeConfigController extends FilterController<MuseumsIncludeConfigData> {
    constructor(@InjectFilter(MuseumsIncludeConfigFilter) filterService: FilterService<MuseumsIncludeConfigData>) {
        super(filterService);
    }
}

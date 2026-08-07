import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { MuseumsRequiredArtifactsData, MuseumsRequiredFilter } from "../filters/museums-required.filter";

@Controller("museums-required")
export class MuseumsRequiredController extends FilterController<MuseumsRequiredArtifactsData> {
    constructor(@InjectFilter(MuseumsRequiredFilter) filterService: FilterService<MuseumsRequiredArtifactsData>) {
        super(filterService);
    }
}

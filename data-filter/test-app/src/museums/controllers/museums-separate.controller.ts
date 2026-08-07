import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { MuseumsSeparateArtifactsData, MuseumsSeparateFilter } from "../filters/museums-separate.filter";

@Controller("museums-separate")
export class MuseumsSeparateController extends FilterController<MuseumsSeparateArtifactsData> {
    constructor(@InjectFilter(MuseumsSeparateFilter) filterService: FilterService<MuseumsSeparateArtifactsData>) {
        super(filterService);
    }
}

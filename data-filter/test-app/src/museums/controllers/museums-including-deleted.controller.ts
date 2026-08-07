import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import {
    MuseumsIncludingDeletedArtifactsData,
    MuseumsIncludingDeletedFilter
} from "../filters/museums-including-deleted.filter";

@Controller("museums-including-deleted")
export class MuseumsIncludingDeletedController extends FilterController<MuseumsIncludingDeletedArtifactsData> {
    constructor(
        @InjectFilter(MuseumsIncludingDeletedFilter)
        filterService: FilterService<MuseumsIncludingDeletedArtifactsData>
    ) {
        super(filterService);
    }
}

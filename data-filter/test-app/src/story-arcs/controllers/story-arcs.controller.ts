import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { StoryArcsData, StoryArcsFilter } from "../filters/story-arcs.filter";

@Controller("story-arcs")
export class StoryArcsController extends FilterController<StoryArcsData> {
    constructor(@InjectFilter(StoryArcsFilter) filterService: FilterService<StoryArcsData>) {
        super(filterService);
    }
}

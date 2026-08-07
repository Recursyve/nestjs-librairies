import { Controller } from "@nestjs/common";
import { FilterService, InjectFilter, OpenApiFilterController } from "@recursyve/nestjs-data-filter";
import { HarborNoticesData, HarborNoticesFilter } from "../filters/harbor-notices.filter";

/**
 * Characterizes OpenApiFilterController mixin + FilterResultModelMixin wiring.
 * HTTP contract matches FilterController.
 */
@Controller("harbor-notices")
export class HarborNoticesController extends OpenApiFilterController(HarborNoticesData) {
    constructor(@InjectFilter(HarborNoticesFilter) filterService: FilterService<HarborNoticesData>) {
        super(filterService);
    }
}

import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { SpellScrollsData, SpellScrollsFilter } from "../filters/spell-scrolls.filter";

@Controller("spell-scrolls")
export class SpellScrollsController extends FilterController<SpellScrollsData> {
    constructor(@InjectFilter(SpellScrollsFilter) filterService: FilterService<SpellScrollsData>) {
        super(filterService);
    }
}

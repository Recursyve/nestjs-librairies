import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { GuildChartersData, GuildChartersFilter } from "../filters/guild-charters.filter";

@Controller("guild-charters")
export class GuildChartersController extends FilterController<GuildChartersData> {
    constructor(@InjectFilter(GuildChartersFilter) filterService: FilterService<GuildChartersData>) {
        super(filterService);
    }
}

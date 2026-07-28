import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { MemberTiersData, MemberTiersFilter } from "../filters/member-tiers.filter";

@Controller("member-tiers")
export class MemberTiersController extends FilterController<MemberTiersData> {
    constructor(@InjectFilter(MemberTiersFilter) filterService: FilterService<MemberTiersData>) {
        super(filterService);
    }
}

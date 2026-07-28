import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { GroupLabEntriesData, GroupLabFilter } from "../filters/group-lab.filter";

@Controller("group-lab")
export class GroupLabController extends FilterController<GroupLabEntriesData> {
    constructor(@InjectFilter(GroupLabFilter) filterService: FilterService<GroupLabEntriesData>) {
        super(filterService);
    }
}

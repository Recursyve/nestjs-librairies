import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    GroupFilter,
    NumberFilter,
    SelectFilter,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { GroupLabEntries } from "../models/group-lab-entries.model";

@Data(GroupLabEntries)
@Attributes(["status", "tier", "score"])
export class GroupLabEntriesData {}

@Injectable()
export class GroupLabFilter extends BaseFilter<GroupLabEntriesData> {
    public readonly dataDefinition = GroupLabEntriesData;

    public readonly status = new TextFilter({ attribute: "status" });

    public readonly eagerStatusScoreGroup = new GroupFilter({
        rootFilter: new SelectFilter({
            attribute: "status",
            values: async () =>
                Promise.resolve([
                    { id: "open", name: "Open" },
                    { id: "closed", name: "Closed" }
                ]),
            lazyLoading: false
        }),
        valueFilter: new NumberFilter({ attribute: "score" })
    });

    public readonly lazyTierScoreGroup = new GroupFilter({
        lazyLoading: true,
        rootFilter: new SelectFilter({
            attribute: "tier",
            values: async () =>
                Promise.resolve([
                    { id: "gold", name: "Gold" },
                    { id: "silver", name: "Silver" }
                ]),
            lazyLoading: true
        }),
        getValueFilter: async () => Promise.resolve(new NumberFilter({ attribute: "score" }))
    });
}

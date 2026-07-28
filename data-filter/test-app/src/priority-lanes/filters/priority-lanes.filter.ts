import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, EnumOrderRule, TextFilter } from "@recursyve/nestjs-data-filter";
import { PriorityLanes } from "../models/priority-lanes.model";

@Data(PriorityLanes)
@Attributes(["code", "priority_level"])
export class PriorityLanesData {}

@Injectable()
export class PriorityLanesFilter extends BaseFilter<PriorityLanesData> {
    public readonly dataDefinition = PriorityLanesData;

    public readonly code = new TextFilter({ attribute: "code" });
    public readonly priorityLevel = new TextFilter({ attribute: "priority_level" });

    public readonly lanePriorityOrder = new EnumOrderRule({
        attribute: "priority_level",
        priorities: ["high", "medium", "low"]
    });
}

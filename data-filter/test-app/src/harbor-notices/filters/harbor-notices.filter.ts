import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    NumberFilter,
    SearchableAttributes,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { HarborNotices } from "../models/harbor-notices.model";

@Data(HarborNotices)
@Attributes(["headline", "priority"])
@SearchableAttributes(["headline"])
export class HarborNoticesData {}

@Injectable()
export class HarborNoticesFilter extends BaseFilter<HarborNoticesData> {
    public readonly dataDefinition = HarborNoticesData;

    public readonly headline = new TextFilter({ attribute: "headline" });
    public readonly priority = new NumberFilter({ attribute: "priority" });
}

import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, Limit, Order, Separate, TextFilter, Where } from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

/**
 * Characterizes @Separate + @Order + @Limit + @Where together.
 */
@Data(Museums)
@Attributes(["name"])
export class MuseumsOrderedLimitedData {
    @Attributes(["title", "status", "display_rank"])
    @Where({ status: () => "on_display" }, true)
    @Order([["display_rank", "ASC"]])
    @Limit(2)
    @Separate()
    artifacts?: Artifacts[];
}

@Injectable()
export class MuseumsOrderedLimitedFilter extends BaseFilter<MuseumsOrderedLimitedData> {
    public readonly dataDefinition = MuseumsOrderedLimitedData;

    public readonly name = new TextFilter({ attribute: "name" });
}

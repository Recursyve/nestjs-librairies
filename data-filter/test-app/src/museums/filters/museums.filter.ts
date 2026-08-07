import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, SearchableAttributes, TextFilter, Where } from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

/**
 * Characterizes @Where + @Required: only on_display artifacts, museums without
 * matches excluded. Without @Separate, @Order/@Limit are not applied by Sequelize
 * to the nested HasMany collection (characterized on museums-ordered-limited).
 */
@Data(Museums)
@Attributes(["name"])
@SearchableAttributes(["name"])
export class MuseumsDisplayedData {
    @Attributes(["title", "status", "display_rank"])
    @Where({ status: () => "on_display" }, true)
    artifacts?: Artifacts[];
}

@Injectable()
export class MuseumsFilter extends BaseFilter<MuseumsDisplayedData> {
    public readonly dataDefinition = MuseumsDisplayedData;

    public readonly name = new TextFilter({ attribute: "name" });
}

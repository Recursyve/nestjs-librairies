import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, Include, TextFilter } from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

/**
 * Characterizes Include(path, separate: false) BelongsTo nested include.
 */
@Data(Museums)
@Attributes(["name"])
export class MuseumsIncludeNestedData {
    @Attributes(["title", "status"])
    @Include("museum", false)
    artifacts?: Artifacts[];
}

@Injectable()
export class MuseumsIncludeNestedFilter extends BaseFilter<MuseumsIncludeNestedData> {
    public readonly dataDefinition = MuseumsIncludeNestedData;

    public readonly name = new TextFilter({ attribute: "name" });
}

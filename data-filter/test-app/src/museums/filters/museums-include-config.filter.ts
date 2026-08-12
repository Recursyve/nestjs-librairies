import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, Include, TextFilter } from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

/**
 * Characterizes the deprecated Include({ path, ... }) object-first overload.
 */
@Data(Museums)
@Attributes(["name"])
export class MuseumsIncludeConfigData {
    @Attributes(["title", "status"])
    @Include({ path: "museum", separate: false })
    artifacts?: Artifacts[];
}

@Injectable()
export class MuseumsIncludeConfigFilter extends BaseFilter<MuseumsIncludeConfigData> {
    public readonly dataDefinition = MuseumsIncludeConfigData;

    public readonly name = new TextFilter({ attribute: "name" });
}

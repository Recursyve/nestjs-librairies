import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, Required, TextFilter } from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

/**
 * Characterizes @Required() alone (INNER JOIN without a path where clause):
 * museums with zero artifacts are excluded.
 */
@Data(Museums)
@Attributes(["name"])
export class MuseumsRequiredArtifactsData {
    @Attributes(["title"])
    @Required(true)
    artifacts?: Artifacts[];
}

@Injectable()
export class MuseumsRequiredFilter extends BaseFilter<MuseumsRequiredArtifactsData> {
    public readonly dataDefinition = MuseumsRequiredArtifactsData;

    public readonly name = new TextFilter({ attribute: "name" });
}

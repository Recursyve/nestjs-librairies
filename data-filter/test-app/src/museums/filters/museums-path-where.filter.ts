import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, Path, TextFilter } from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

/**
 * Characterizes @Path(path, where, required) overload with an explicit path
 * rename distinct from the property key.
 */
@Data(Museums)
@Attributes(["name"])
export class MuseumsPathWhereData {
    @Attributes(["title", "status"])
    @Path("artifacts", { status: () => "archived" }, true)
    archivedArtifacts?: Artifacts[];
}

@Injectable()
export class MuseumsPathWhereFilter extends BaseFilter<MuseumsPathWhereData> {
    public readonly dataDefinition = MuseumsPathWhereData;

    public readonly name = new TextFilter({ attribute: "name" });
}

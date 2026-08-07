import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    IgnoreInSearch,
    SearchableAttributes,
    Separate,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

/**
 * Characterizes @Separate() with @IgnoreInSearch so listing/search by museum name
 * remains usable while nested rows still load via a separate query.
 */
@Data(Museums)
@Attributes(["name"])
@SearchableAttributes(["name"])
export class MuseumsSeparateArtifactsData {
    @IgnoreInSearch()
    @Attributes(["title", "status"])
    @Separate()
    artifacts?: Artifacts[];
}

@Injectable()
export class MuseumsSeparateFilter extends BaseFilter<MuseumsSeparateArtifactsData> {
    public readonly dataDefinition = MuseumsSeparateArtifactsData;

    public readonly name = new TextFilter({ attribute: "name" });
}

import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, Paranoid, TextFilter } from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

/**
 * Characterizes @Paranoid(false): soft-deleted nested rows remain visible.
 */
@Data(Museums)
@Attributes(["name"])
export class MuseumsIncludingDeletedArtifactsData {
    @Attributes(["title", "status", "display_rank"])
    @Paranoid(false)
    artifacts?: Artifacts[];
}

@Injectable()
export class MuseumsIncludingDeletedFilter extends BaseFilter<MuseumsIncludingDeletedArtifactsData> {
    public readonly dataDefinition = MuseumsIncludingDeletedArtifactsData;

    public readonly name = new TextFilter({ attribute: "name" });
}

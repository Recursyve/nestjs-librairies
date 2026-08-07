import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, Include, TextFilter } from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

/**
 * @p0 suspected-defect
 * Include(path, true) on a BelongsTo association throws
 * "Only HasMany associations support include.separate".
 */
@Data(Museums)
@Attributes(["name"])
export class MuseumsIncludeSeparateData {
    @Attributes(["title", "status"])
    @Include("museum", true)
    artifacts?: Artifacts[];
}

@Injectable()
export class MuseumsIncludeSeparateFilter extends BaseFilter<MuseumsIncludeSeparateData> {
    public readonly dataDefinition = MuseumsIncludeSeparateData;

    public readonly name = new TextFilter({ attribute: "name" });
}

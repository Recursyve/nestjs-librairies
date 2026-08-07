import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    SearchableAttributes,
    Separate,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { Artifacts } from "../../artifacts/models/artifacts.model";
import { Museums } from "../models/museums.model";

/**
 * @p0 suspected-defect
 * @Separate() without @IgnoreInSearch still registers nested searchable fields,
 * but search includes omit separate paths → SQL "Unknown column" / HTTP 500.
 */
@Data(Museums)
@Attributes(["name"])
@SearchableAttributes(["name"])
export class MuseumsSeparateSearchableData {
    @Attributes(["title", "status"])
    @SearchableAttributes(["title"])
    @Separate()
    artifacts?: Artifacts[];
}

@Injectable()
export class MuseumsSeparateSearchableFilter extends BaseFilter<MuseumsSeparateSearchableData> {
    public readonly dataDefinition = MuseumsSeparateSearchableData;

    public readonly name = new TextFilter({ attribute: "name" });
}

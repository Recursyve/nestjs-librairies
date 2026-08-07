import { Attributes, Data, Exports, SearchableAttributes } from "@recursyve/nestjs-data-filter";
import { Museums } from "../models/museums.model";

/**
 * Plain museum listing used by repository-probe routes.
 * No nested path attributes: repository.count() with HasMany includes hits
 * only_full_group_by on MySQL (characterized separately via nested data).
 */
@Data(Museums)
@Attributes(["name"])
@SearchableAttributes(["name"])
@Exports(["name"])
export class MuseumsPlainData extends Museums {}

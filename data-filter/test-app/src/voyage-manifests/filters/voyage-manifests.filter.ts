import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, SearchableAttributes, TextFilter } from "@recursyve/nestjs-data-filter";
import { VoyageManifests } from "../models/voyage-manifests.model";

@Data(VoyageManifests)
@Attributes(["vessel_name", "season", "cargo_code"])
@SearchableAttributes(["vessel_name", "cargo_code"])
export class VoyageManifestsData {}

@Injectable()
export class VoyageManifestsFilter extends BaseFilter<VoyageManifestsData> {
    public readonly dataDefinition = VoyageManifestsData;

    public readonly season = new TextFilter({ attribute: "season" });
    public readonly vesselName = new TextFilter({ attribute: "vessel_name" });
}

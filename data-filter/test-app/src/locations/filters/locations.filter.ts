import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, TextFilter } from "@recursyve/nestjs-data-filter";
import { Locations } from "../models/locations.model";

@Data(Locations)
@Attributes(["value", "unique_code"])
export class LocationsData {}

@Injectable()
export class LocationsFilter extends BaseFilter<LocationsData> {
    public readonly dataDefinition = LocationsData;

    public readonly value = new TextFilter({ attribute: "value" });
    public readonly uniqueCode = new TextFilter({ attribute: "unique_code" });
}

import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    CoordinateFilter,
    Data,
    Distance,
    GeoLocalizationFilter,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { Coords } from "../models/coords.model";

@Data(Coords)
@Attributes(["address", "postal_code"])
@Distance({
    name: "distance",
    attribute: "geo_point",
    coordinates: (option) => option.coordinates
})
export class CoordsData {}

@Injectable()
export class CoordsFilter extends BaseFilter<CoordsData> {
    public readonly dataDefinition = CoordsData;

    public readonly address = new TextFilter({ attribute: "address" });

    public readonly distance = new GeoLocalizationFilter({
        rootFilter: new CoordinateFilter({ attribute: "geo_point" })
    });
}

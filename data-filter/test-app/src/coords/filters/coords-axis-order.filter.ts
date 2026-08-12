import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    CoordinateFilter,
    Data,
    Distance,
    GeoBoundsFilter,
    GeoLocalizationFilter
} from "@recursyve/nestjs-data-filter";
import { Coords } from "../models/coords.model";

type DistanceConditions = { coordinates: [number, number] };

/**
 * Declares both axis orders on the same POINT column so a single query compares them.
 */
@Data(Coords)
@Attributes(["address"])
@Distance({
    name: "distance",
    attribute: "geo_point",
    coordinates: (option: DistanceConditions) => option.coordinates
})
@Distance({
    name: "legacy_distance",
    attribute: "geo_point",
    legacyAxisOrder: true,
    coordinates: (option: DistanceConditions) => option.coordinates
})
export class CoordsAxisOrderData {}

@Injectable()
export class CoordsAxisOrderFilter extends BaseFilter<CoordsAxisOrderData> {
    public readonly dataDefinition = CoordsAxisOrderData;

    public readonly distance = new GeoLocalizationFilter({
        rootFilter: new CoordinateFilter({ attribute: "geo_point" })
    });

    public readonly legacyDistance = new GeoLocalizationFilter({
        rootFilter: new CoordinateFilter({ attribute: "geo_point" }),
        legacyAxisOrder: true
    });

    public readonly bounds = new GeoBoundsFilter({ attribute: "geo_point" });

    public readonly legacyBounds = new GeoBoundsFilter({ attribute: "geo_point", legacyAxisOrder: true });
}

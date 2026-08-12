import { Attributes, Data, Distance } from "@recursyve/nestjs-data-filter";
import { Coords } from "../../coords/models/coords.model";
import { Places } from "../models/places.model";

type DistanceConditions = { coordinates?: [number, number] };

/**
 * @Distance declared on an included property, so the POINT column must resolve
 * to the include alias. Kept out of AppModule so validateData stays quiet.
 */
@Data(Places)
@Attributes(["id"])
export class PlacesIncludedDistanceData {
    @Attributes(["address"])
    @Distance({
        name: "distance",
        attribute: "geo_point",
        coordinates: (options: DistanceConditions) => options.coordinates as [number, number]
    })
    geoCoord?: Coords;
}

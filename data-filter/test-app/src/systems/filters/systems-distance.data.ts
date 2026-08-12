import { Attributes, Data, Distance } from "@recursyve/nestjs-data-filter";
import { Systems } from "../models/systems.model";

type DistanceConditions = { coordinates?: [number, number] };

/**
 * @Distance built from separate lat/lng columns instead of a POINT column.
 * Kept out of AppModule so validateData stays quiet.
 */
@Data(Systems)
@Attributes(["file_number"])
@Distance({
    name: "distance",
    latAttribute: "latitude",
    lngAttribute: "longitude",
    coordinates: (options: DistanceConditions) => options.coordinates as [number, number]
})
export class SystemsLatLngDistanceData {}

/**
 * Same lat/lng source, projected through an explicit SRID.
 */
@Data(Systems)
@Attributes(["file_number"])
@Distance({
    name: "distance",
    latAttribute: "latitude",
    lngAttribute: "longitude",
    srid: 4326,
    coordinates: (options: DistanceConditions) => options.coordinates as [number, number]
})
export class SystemsSridDistanceData {}

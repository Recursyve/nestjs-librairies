import { Coords, GeoPoint } from "../../src/coords/models/coords.model";
import { createSeededCoords } from "./create-seeded-coords";

type CreateSeededMirroredCoordsParams = {
    address: string;
    geo_point: GeoPoint;
    location_id: number;
    postal_code: string;
    street_number: number;
};

/**
 * Overwrites geo_point with the latitude in the first coordinate, which is what a consumer
 * ended up storing to compensate for the reference point the library used to build. Fixtures
 * for `legacyAxisOrder` need that storage, since the option exists for that data.
 */
export async function createSeededMirroredCoords(params: CreateSeededMirroredCoordsParams) {
    const row = await createSeededCoords(params);
    const [longitude, latitude] = params.geo_point.coordinates;
    await Coords.sequelize!.query(
        `UPDATE coords SET geo_point = ST_GeomFromText('POINT(${latitude} ${longitude})', 0) WHERE id = ${row.id}`
    );

    return row;
}

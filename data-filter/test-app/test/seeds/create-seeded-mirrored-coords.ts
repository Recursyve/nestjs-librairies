import { Coords } from "../../src/coords/models/coords.model";
import { createSeededCoords, CreateSeededCoordsParams, SeededCoords } from "./create-seeded-coords";

/**
 * Overwrites geo_point with the latitude in the first coordinate, the order the library's
 * reference literal uses under SRID 0. Scenarios seeded this way agree with that reference
 * instead of with MySQL's longitude-first storage, so they measure the library against
 * itself rather than against what a consumer stores.
 */
export async function createSeededMirroredCoords(params: CreateSeededCoordsParams): Promise<SeededCoords> {
    const coords = await createSeededCoords(params);
    if (!params.geo_point) {
        return coords;
    }

    const [lng, lat] = params.geo_point.coordinates;
    await Coords.sequelize?.query(
        `UPDATE coords SET geo_point = ST_GeomFromText('POINT(${lat} ${lng})', 0) WHERE id = ${coords.id}`
    );

    return coords;
}

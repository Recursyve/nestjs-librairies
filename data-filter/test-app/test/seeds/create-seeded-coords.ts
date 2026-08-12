import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Coords, GeoPoint } from "../../src/coords/models/coords.model";
import { Seeded } from "./seeded.type";

type CreateSeededCoordsParams = {
    address: string;
    cellphone?: string;
    geo_point?: GeoPoint;
    location_id: number;
    postal_code: string;
    street_number: number;
};

type SeededCoords = Seeded<{
    id: number;
    address: string;
    cellphone: string | undefined;
    geo_point: GeoPoint | undefined;
    location_id: number;
    postal_code: string;
    street_number: number;
}>;

/**
 * Writes geo_point through the GEOMETRY column, so the point lands in the longitude-first
 * order Sequelize produces from GeoJSON — what a consumer storing coordinates normally gets.
 */
export async function createSeededCoords(params: CreateSeededCoordsParams): Promise<SeededCoords> {
    const row = await Coords.create(params);
    if (!arePropertiesDefined(row, "id", "address", "location_id", "postal_code", "street_number")) {
        throw new Error("Failed to seed coords");
    }

    return {
        id: row.id,
        address: row.address,
        cellphone: row.cellphone,
        geo_point: row.geo_point,
        location_id: row.location_id,
        postal_code: row.postal_code,
        street_number: row.street_number,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

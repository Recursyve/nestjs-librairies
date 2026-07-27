import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Places } from "../../src/places/models/places.model";
import { Seeded } from "./seeded.type";

type CreateSeededPlaceParams = {
    billing_coord_id: number;
    geo_coord_id: number;
};

type SeededPlace = Seeded<{
    id: number;
    billing_coord_id: number;
    geo_coord_id: number;
}>;

export async function createSeededPlace(params: CreateSeededPlaceParams): Promise<SeededPlace> {
    const row = await Places.create(params);
    if (!arePropertiesDefined(row, "id", "billing_coord_id", "geo_coord_id")) {
        throw new Error("Failed to seed place");
    }

    return {
        id: row.id,
        billing_coord_id: row.billing_coord_id,
        geo_coord_id: row.geo_coord_id,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

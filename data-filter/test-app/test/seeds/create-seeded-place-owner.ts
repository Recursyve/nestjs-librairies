import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { PlaceOwners } from "../../src/place-owners/models/place-owners.model";
import { Seeded } from "./seeded.type";

type CreateSeededPlaceOwnerParams = {
    owner_id: number;
    place_id: number;
};

type SeededPlaceOwner = Seeded<{
    id: number;
    owner_id: number;
    place_id: number;
}>;

export async function createSeededPlaceOwner(params: CreateSeededPlaceOwnerParams): Promise<SeededPlaceOwner> {
    const row = await PlaceOwners.create(params);
    if (!arePropertiesDefined(row, "id", "owner_id", "place_id")) {
        throw new Error("Failed to seed place owner");
    }

    return {
        id: row.id,
        owner_id: row.owner_id,
        place_id: row.place_id,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

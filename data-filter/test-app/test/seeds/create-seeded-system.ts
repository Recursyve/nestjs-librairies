import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Systems } from "../../src/systems/models/systems.model";
import { Seeded } from "./seeded.type";

type CreateSeededSystemParams = {
    file_number: string;
    latitude: number;
    longitude: number;
    place_id: number;
};

type SeededSystem = Seeded<{
    id: number;
    file_number: string;
    latitude: number;
    longitude: number;
    place_id: number;
}>;

export async function createSeededSystem(params: CreateSeededSystemParams): Promise<SeededSystem> {
    const row = await Systems.create(params);
    if (!arePropertiesDefined(row, "id", "file_number", "latitude", "longitude", "place_id")) {
        throw new Error("Failed to seed system");
    }

    return {
        id: row.id,
        file_number: row.file_number,
        latitude: row.latitude,
        longitude: row.longitude,
        place_id: row.place_id,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

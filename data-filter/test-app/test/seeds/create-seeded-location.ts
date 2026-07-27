import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Locations } from "../../src/locations/models/locations.model";
import { Seeded } from "./seeded.type";

type CreateSeededLocationParams = {
    unique_code: string;
    value: string;
};

type SeededLocation = Seeded<{
    id: number;
    unique_code: string;
    value: string;
}>;

export async function createSeededLocation(params: CreateSeededLocationParams): Promise<SeededLocation> {
    const row = await Locations.create(params);
    if (!arePropertiesDefined(row, "id", "value", "unique_code")) {
        throw new Error("Failed to seed location");
    }

    return {
        id: row.id,
        unique_code: row.unique_code,
        value: row.value,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

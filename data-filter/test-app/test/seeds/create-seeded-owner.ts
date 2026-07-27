import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Owners } from "../../src/owners/models/owners.model";
import { Seeded } from "./seeded.type";

type CreateSeededOwnerParams = {
    person_id: number;
};

type SeededOwner = Seeded<{
    id: number;
    person_id: number;
}>;

export async function createSeededOwner(params: CreateSeededOwnerParams): Promise<SeededOwner> {
    const row = await Owners.create(params);
    if (!arePropertiesDefined(row, "id", "person_id")) {
        throw new Error("Failed to seed owner");
    }

    return {
        id: row.id,
        person_id: row.person_id,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

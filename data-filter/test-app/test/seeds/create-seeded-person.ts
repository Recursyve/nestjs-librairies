import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Persons } from "../../src/persons/models/persons.model";
import { Seeded } from "./seeded.type";

type CreateSeededPersonParams = {
    coord_id?: number;
    email: string;
    first_name: string;
    last_name?: string;
};
type SeededPerson = Seeded<{
    id: number;
    coord_id: number | undefined;
    email: string;
    first_name: string;
    last_name: string | undefined;
}>;

export async function createSeededPerson(params: CreateSeededPersonParams): Promise<SeededPerson> {
    const row = await Persons.create(params);
    if (!arePropertiesDefined(row, "id", "email", "first_name")) {
        throw new Error("Failed to seed person");
    }

    return {
        id: row.id,
        coord_id: row.coord_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

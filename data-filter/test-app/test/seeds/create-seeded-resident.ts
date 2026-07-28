import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Residents } from "../../src/residents/models/residents.model";
import { Seeded } from "./seeded.type";

type CreateSeededResidentParams = {
    address_id?: number;
    email: string;
    full_name: string;
};

type SeededResident = Seeded<{
    id: number;
    address_id: number | undefined;
    email: string;
    full_name: string;
}>;

export async function createSeededResident(params: CreateSeededResidentParams): Promise<SeededResident> {
    const row = await Residents.create(params);
    if (!arePropertiesDefined(row, "id", "email", "full_name")) {
        throw new Error("Failed to seed resident");
    }

    return {
        id: row.id,
        address_id: row.address_id,
        email: row.email,
        full_name: row.full_name,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

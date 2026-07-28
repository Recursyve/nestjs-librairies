import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { ResidentAddresses } from "../../src/resident-addresses/models/resident-addresses.model";
import { Seeded } from "./seeded.type";

type CreateSeededResidentAddressParams = {
    location_id: number;
    postal_code: string;
    street: string;
};

type SeededResidentAddress = Seeded<{
    id: number;
    location_id: number;
    postal_code: string;
    street: string;
}>;

export async function createSeededResidentAddress(
    params: CreateSeededResidentAddressParams
): Promise<SeededResidentAddress> {
    const row = await ResidentAddresses.create(params);
    if (!arePropertiesDefined(row, "id", "location_id", "postal_code", "street")) {
        throw new Error("Failed to seed resident address");
    }

    return {
        id: row.id,
        location_id: row.location_id,
        postal_code: row.postal_code,
        street: row.street,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

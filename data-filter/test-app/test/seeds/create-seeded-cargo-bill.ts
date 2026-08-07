import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { CargoBills } from "../../src/cargo-bills/models/cargo-bills.model";
import { Seeded } from "./seeded.type";

type CreateSeededCargoBillParams = {
    bill_code: string;
    shipper: string;
    confidential_note: string;
};

type SeededCargoBill = Seeded<{
    id: number;
    bill_code: string;
    shipper: string;
    confidential_note: string;
}>;

export async function createSeededCargoBill(params: CreateSeededCargoBillParams): Promise<SeededCargoBill> {
    const row = await CargoBills.create(params);
    if (!arePropertiesDefined(row, "id", "bill_code", "shipper", "confidential_note")) {
        throw new Error("Failed to seed cargo bill");
    }

    return {
        id: row.id,
        bill_code: row.bill_code,
        shipper: row.shipper,
        confidential_note: row.confidential_note,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { ConfigLabItems } from "../../src/config-lab/models/config-lab-items.model";
import { Seeded } from "./seeded.type";

type CreateSeededConfigLabItemParams = {
    label: string;
    secret_code: string;
};

type SeededConfigLabItem = Seeded<{
    id: number;
    label: string;
    secret_code: string;
}>;

export async function createSeededConfigLabItem(params: CreateSeededConfigLabItemParams): Promise<SeededConfigLabItem> {
    const row = await ConfigLabItems.create(params);
    if (!arePropertiesDefined(row, "id", "label", "secret_code")) {
        throw new Error("Failed to seed config lab item");
    }

    return {
        id: row.id,
        label: row.label,
        secret_code: row.secret_code,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { CatalogItems } from "../../src/catalog-items/models/catalog-items.model";
import { Seeded } from "./seeded.type";

type CreateSeededCatalogItemParams = {
    code: string;
    label: string;
    status: string;
};

type SeededCatalogItem = Seeded<{
    id: number;
    code: string;
    label: string;
    status: string;
}>;

export async function createSeededCatalogItem(params: CreateSeededCatalogItemParams): Promise<SeededCatalogItem> {
    const row = await CatalogItems.create(params);
    if (!arePropertiesDefined(row, "id", "code", "label", "status")) {
        throw new Error("Failed to seed catalog item");
    }

    return {
        id: row.id,
        code: row.code,
        label: row.label,
        status: row.status,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Products } from "../../src/products/models/products.model";
import { Seeded } from "./seeded.type";

type CreateSeededProductParams = {
    listed_at?: Date | string;
    metadata: Record<string, any>;
    name: string;
    sku: string;
    status: string;
    stock?: number;
    tags: string[];
    translations?: Record<string, string>;
};

type SeededProduct = Seeded<{
    id: number;
    metadata: Record<string, any>;
    name: string;
    sku: string;
    status: string;
    stock: number | undefined;
    tags: string[];
}>;

export async function createSeededProduct(params: CreateSeededProductParams): Promise<SeededProduct> {
    const row = await Products.create(params);
    if (!arePropertiesDefined(row, "id", "metadata", "name", "sku", "status", "tags")) {
        throw new Error("Failed to seed product");
    }

    return {
        id: row.id,
        metadata: row.metadata,
        name: row.name,
        sku: row.sku,
        status: row.status,
        stock: row.stock,
        tags: row.tags,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

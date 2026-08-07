import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Warehouses } from "../../src/warehouses/models/warehouses.model";
import { Seeded } from "./seeded.type";

type CreateSeededWarehouseParams = {
    code: string;
};

type SeededWarehouse = Seeded<{
    id: number;
    code: string;
}>;

export async function createSeededWarehouse(params: CreateSeededWarehouseParams): Promise<SeededWarehouse> {
    const warehouse = await Warehouses.create(params);
    if (!arePropertiesDefined(warehouse, "id", "code")) {
        throw new Error("Failed to seed warehouse");
    }

    return {
        id: warehouse.id,
        code: warehouse.code,
        async [Symbol.asyncDispose]() {
            await warehouse.destroy({ force: true });
        }
    };
}

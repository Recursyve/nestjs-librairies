import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { StockLines } from "../../src/stock-lines/models/stock-lines.model";
import { Seeded } from "./seeded.type";

type CreateSeededStockLineParams = {
    warehouse_id: number;
    sku: string;
    quantity: number;
};

type SeededStockLine = Seeded<{
    id: number;
    warehouse_id: number;
    sku: string;
    quantity: number;
}>;

export async function createSeededStockLine(params: CreateSeededStockLineParams): Promise<SeededStockLine> {
    const line = await StockLines.create(params);
    if (!arePropertiesDefined(line, "id", "warehouse_id", "sku", "quantity")) {
        throw new Error("Failed to seed stock line");
    }

    return {
        id: line.id,
        warehouse_id: line.warehouse_id,
        sku: line.sku,
        quantity: line.quantity,
        async [Symbol.asyncDispose]() {
            await line.destroy({ force: true });
        }
    };
}

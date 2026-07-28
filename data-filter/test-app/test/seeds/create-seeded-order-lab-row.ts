import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { OrderLabRows } from "../../src/order-lab/models/order-lab-rows.model";
import { Seeded } from "./seeded.type";

type CreateSeededOrderLabRowParams = {
    code: string;
    label?: string | null;
};

type SeededOrderLabRow = Seeded<{
    id: number;
    code: string;
    label: string | null;
}>;

export async function createSeededOrderLabRow(params: CreateSeededOrderLabRowParams): Promise<SeededOrderLabRow> {
    const row = await OrderLabRows.create(params);
    if (!arePropertiesDefined(row, "id", "code")) {
        throw new Error("Failed to seed order lab row");
    }

    return {
        id: row.id,
        code: row.code,
        label: row.label ?? null,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

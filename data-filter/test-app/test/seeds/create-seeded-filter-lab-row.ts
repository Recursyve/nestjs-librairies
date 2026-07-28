import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { FilterLabRows } from "../../src/filter-lab/models/filter-lab-rows.model";
import { Seeded } from "./seeded.type";

type CreateSeededFilterLabRowParams = {
    code: string;
    detail_note: string;
};

type SeededFilterLabRow = Seeded<{
    id: number;
    code: string;
    detail_note: string;
}>;

export async function createSeededFilterLabRow(params: CreateSeededFilterLabRowParams): Promise<SeededFilterLabRow> {
    const row = await FilterLabRows.create(params);
    if (!arePropertiesDefined(row, "id", "code", "detail_note")) {
        throw new Error("Failed to seed filter lab row");
    }

    return {
        id: row.id,
        code: row.code,
        detail_note: row.detail_note,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

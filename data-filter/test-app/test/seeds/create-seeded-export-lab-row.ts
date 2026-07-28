import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { ExportLabRows } from "../../src/export-lab/models/export-lab-rows.model";
import { Seeded } from "./seeded.type";

type CreateSeededExportLabRowParams = {
    code: string;
    label_en: string;
    label_fr: string;
};

type SeededExportLabRow = Seeded<{
    id: number;
    code: string;
    label_en: string;
    label_fr: string;
}>;

export async function createSeededExportLabRow(params: CreateSeededExportLabRowParams): Promise<SeededExportLabRow> {
    const row = await ExportLabRows.create(params);
    if (!arePropertiesDefined(row, "id", "code", "label_en", "label_fr")) {
        throw new Error("Failed to seed export lab row");
    }

    return {
        id: row.id,
        code: row.code,
        label_en: row.label_en,
        label_fr: row.label_fr,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { GroupLabEntries } from "../../src/group-lab/models/group-lab-entries.model";
import { Seeded } from "./seeded.type";

type CreateSeededGroupLabEntryParams = {
    score: number;
    status: string;
    tier: string;
};

type SeededGroupLabEntry = Seeded<{
    id: number;
    score: number;
    status: string;
    tier: string;
}>;

export async function createSeededGroupLabEntry(params: CreateSeededGroupLabEntryParams): Promise<SeededGroupLabEntry> {
    const row = await GroupLabEntries.create(params);
    if (!arePropertiesDefined(row, "id", "score", "status", "tier")) {
        throw new Error("Failed to seed group lab entry");
    }

    return {
        id: row.id,
        score: row.score,
        status: row.status,
        tier: row.tier,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

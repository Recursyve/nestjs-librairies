import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { HarborNotices } from "../../src/harbor-notices/models/harbor-notices.model";
import { Seeded } from "./seeded.type";

type CreateSeededHarborNoticeParams = {
    headline: string;
    priority: number;
};

type SeededHarborNotice = Seeded<{
    id: number;
    headline: string;
    priority: number;
}>;

export async function createSeededHarborNotice(params: CreateSeededHarborNoticeParams): Promise<SeededHarborNotice> {
    const row = await HarborNotices.create(params);
    if (!arePropertiesDefined(row, "id", "headline", "priority")) {
        throw new Error("Failed to seed harbor notice");
    }

    return {
        id: row.id,
        headline: row.headline,
        priority: row.priority,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

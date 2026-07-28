import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { ProfileCaptions } from "../../src/profile-captions/models/profile-captions.model";
import { Seeded } from "./seeded.type";

type CreateSeededProfileCaptionParams = {
    caption: string;
    category: string;
};

type SeededProfileCaption = Seeded<{
    id: number;
    caption: string;
    category: string;
}>;

export async function createSeededProfileCaption(
    params: CreateSeededProfileCaptionParams
): Promise<SeededProfileCaption> {
    const row = await ProfileCaptions.create(params);
    if (!arePropertiesDefined(row, "id", "caption", "category")) {
        throw new Error("Failed to seed profile caption");
    }

    return {
        id: row.id,
        caption: row.caption,
        category: row.category,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

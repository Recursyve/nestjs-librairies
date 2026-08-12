import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { SpellScrolls } from "../../src/spell-scrolls/models/spell-scrolls.model";
import { Seeded } from "./seeded.type";

type CreateSeededSpellScrollParams = {
    title: string;
    mana_cost: number;
};

type SeededSpellScroll = Seeded<{
    id: number;
    title: string;
    mana_cost: number;
}>;

export async function createSeededSpellScroll(params: CreateSeededSpellScrollParams): Promise<SeededSpellScroll> {
    const row = await SpellScrolls.create(params);
    if (!arePropertiesDefined(row, "id", "title", "mana_cost")) {
        throw new Error("Failed to seed spell scroll");
    }

    return {
        id: row.id,
        title: row.title,
        mana_cost: row.mana_cost,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

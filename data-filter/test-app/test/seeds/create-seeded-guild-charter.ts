import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { GuildCharters } from "../../src/guild-charters/models/guild-charters.model";
import { Seeded } from "./seeded.type";

type CreateSeededGuildCharterParams = {
    guild_name: string;
    region: string;
};

type SeededGuildCharter = Seeded<{
    id: number;
    guild_name: string;
    region: string;
}>;

export async function createSeededGuildCharter(params: CreateSeededGuildCharterParams): Promise<SeededGuildCharter> {
    const row = await GuildCharters.create(params);
    if (!arePropertiesDefined(row, "id", "guild_name", "region")) {
        throw new Error("Failed to seed guild charter");
    }

    return {
        id: row.id,
        guild_name: row.guild_name,
        region: row.region,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

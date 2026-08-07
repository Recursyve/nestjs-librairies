import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededGuildCharter } from "./seeds/create-seeded-guild-charter";

describe("forFeature filters[].inject", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("applies the injected region as a required default filter", async () => {
        await using north = await createSeededGuildCharter({ guild_name: "Northern Watch", region: "north" });
        await using south = await createSeededGuildCharter({ guild_name: "Southern Reach", region: "south" });
        await using northDecoy = await createSeededGuildCharter({
            guild_name: "North Decoy Name",
            region: "east"
        });

        const ids = await harness.filterIds("guild-charters", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([north.id]);
        expect(ids).not.toContain(south.id);
        expect(ids).not.toContain(northDecoy.id);
    });
});

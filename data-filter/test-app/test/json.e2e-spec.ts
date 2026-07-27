import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CharacterizationHarness, defaultPage, getCharacterizationHarness } from "./harness/characterization-harness";

describe("JSON filtering and search behavior", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("filters products by JSON object path category", async () => {
        const ids = await harness.filterIds("products", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "category", operation: FilterOperatorTypes.Equal, value: "electronics" }]
            }
        });

        expect(ids.sort()).toEqual([harness.seedIds.products.widget, harness.seedIds.products.gadget].sort());
    });

    it("filters products by JSON object path brand", async () => {
        const ids = await harness.filterIds("products", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "brand", operation: FilterOperatorTypes.Equal, value: "Acme" }]
            }
        });

        expect(ids).toEqual([harness.seedIds.products.widget]);
    });

    it("filters products by JSON array tag equal", async () => {
        const ids = await harness.filterIds("products", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "tag", operation: FilterOperatorTypes.Equal, value: "featured" }]
            }
        });

        expect(ids).toEqual([harness.seedIds.products.widget]);
    });
});

import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CharacterizationHarness, defaultPage, getCharacterizationHarness } from "./harness/characterization-harness";

describe("search", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("searches persons by first name token", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            search: { value: "Alice" },
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([harness.seedIds.persons.alice]);
    });

    it("searches persons across nested address fields", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            search: { value: "Saint-Jean" },
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([harness.seedIds.persons.bob]);
    });

    it("matches multiple tokens with AND semantics on persons search", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            search: { value: "Bob Beta" },
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([harness.seedIds.persons.bob]);
    });

    it("searches products by sku", async () => {
        const ids = await harness.filterIds("products", {
            page: defaultPage,
            search: { value: "WDG-001" },
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([harness.seedIds.products.widget]);
    });
});

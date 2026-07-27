import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CharacterizationHarness, defaultPage, getCharacterizationHarness } from "./harness/characterization-harness";

describe("string operators", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("filters with contains on email", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "email", operation: FilterOperatorTypes.Contains, value: "example.com" }]
            }
        });

        expect(ids).toHaveLength(4);
    });

    it("filters with begins_with on first name", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.BeginsWith, value: "Ch" }]
            }
        });

        expect(ids).toEqual([harness.seedIds.persons.charlie]);
    });

    it("filters with ends_with on email", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "email", operation: FilterOperatorTypes.EndsWith, value: "bob@example.com" }]
            }
        });

        expect(ids).toEqual([harness.seedIds.persons.bob]);
    });

    it("filters with not_contains on city", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "city", operation: FilterOperatorTypes.NotContains, value: "Montreal" }]
            }
        });

        expect(ids.sort()).toEqual([harness.seedIds.persons.bob, harness.seedIds.persons.diana].sort());
    });
});

describe("IN / NOT IN operators", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("filters products with in on status", async () => {
        const ids = await harness.filterIds("products", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "status", operation: FilterOperatorTypes.In, value: ["active", "pending"] }]
            }
        });

        expect(ids.sort()).toEqual(
            [harness.seedIds.products.widget, harness.seedIds.products.gadget, harness.seedIds.products.legacy].sort()
        );
    });

    it("filters products with not_in on status", async () => {
        const ids = await harness.filterIds("products", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "status", operation: FilterOperatorTypes.NotIn, value: ["inactive"] }]
            }
        });

        expect(ids.sort()).toEqual(
            [harness.seedIds.products.widget, harness.seedIds.products.gadget, harness.seedIds.products.legacy].sort()
        );
    });
});

describe("NULL behavior", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("filters persons with is_null on last name", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "lastName", operation: FilterOperatorTypes.IsNull, value: null }]
            }
        });

        expect(ids).toEqual([harness.seedIds.persons.diana]);
    });

    it("filters persons with is_not_null on last name", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "lastName", operation: FilterOperatorTypes.IsNotNull, value: null }]
            }
        });

        expect(ids.sort()).toEqual(
            [harness.seedIds.persons.alice, harness.seedIds.persons.bob, harness.seedIds.persons.charlie].sort()
        );
    });

    it("filters products with is_null on stock", async () => {
        const ids = await harness.filterIds("products", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "stock", operation: FilterOperatorTypes.IsNull, value: null }]
            }
        });

        expect(ids).toEqual([harness.seedIds.products.legacy]);
    });
});

import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CharacterizationHarness, defaultPage, getCharacterizationHarness } from "./harness/characterization-harness";

describe("equality / inequality operators", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("filters persons with equal on first name", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(ids).toEqual([harness.seedIds.persons.alice]);
    });

    it("filters persons with not_equal on first name", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.NotEqual, value: "Alice" }]
            }
        });

        expect(ids.sort()).toEqual(
            [harness.seedIds.persons.bob, harness.seedIds.persons.charlie, harness.seedIds.persons.diana].sort()
        );
    });
});

describe("numeric comparisons", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("filters products with greater on stock", async () => {
        const ids = await harness.filterIds("products", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "stock", operation: FilterOperatorTypes.Greater, value: 10 }]
            }
        });

        expect(ids).toEqual([harness.seedIds.products.manual]);
    });

    it("filters products with less_or_equal on stock", async () => {
        const ids = await harness.filterIds("products", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "stock", operation: FilterOperatorTypes.LessOrEqual, value: 10 }]
            }
        });

        expect(ids.sort()).toEqual([harness.seedIds.products.gadget, harness.seedIds.products.widget].sort());
    });
});

/**
 * @p0 suspected-defect
 * Observed: DateFilter on nested contract.start_date returns no rows for seeded active contracts.
 * Intended: date comparisons should match DATEONLY values stored in MySQL.
 */
describe("date comparisons on nested contract paths", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("currently returns no rows for greater_or_equal on contract start date", async () => {
        const ids = await harness.filterIds("contract-systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "contractStart", operation: FilterOperatorTypes.GreaterOrEqual, value: "2024-01-01" }]
            }
        });

        expect(ids).toEqual([]);
    });

    it("filters contract-systems with between on contract start date for expired contract", async () => {
        const ids = await harness.filterIds("contract-systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "contractStart",
                        operation: FilterOperatorTypes.Between,
                        value: ["2019-12-31", "2021-01-02"]
                    }
                ]
            }
        });

        expect(ids).toEqual([harness.seedIds.contractSystems.cs3]);
    });
});

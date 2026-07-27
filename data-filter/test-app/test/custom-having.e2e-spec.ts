import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CharacterizationHarness, defaultPage, getCharacterizationHarness } from "./harness/characterization-harness";

/**
 * @p0 suspected-defect
 * Observed: custom HAVING operators trigger only_full_group_by errors on MySQL (HTTP 500).
 * Intended: grouped counts should be queryable without SQL errors.
 */
describe("custom HAVING operators on MySQL", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("currently responds with 500 for custom none operator on owner email", async () => {
        const response = await harness.postFilter("contract-systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "ownerEmail", operation: "none", value: null }]
            }
        });

        expect(response.status).toBe(500);
    });

    it("currently responds with 500 for visit count having greater_or_equal", async () => {
        const response = await harness.postFilter("contract-systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "visitCount", operation: FilterOperatorTypes.GreaterOrEqual, value: 2 }]
            }
        });

        expect(response.status).toBe(500);
    });
});

describe("custom operators and grouped filters", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("filters contract-systems with owner first name and implicit last-name condition", async () => {
        const ids = await harness.filterIds("contract-systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "ownerFirstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(ids.sort()).toEqual([harness.seedIds.contractSystems.cs1, harness.seedIds.contractSystems.cs3].sort());
    });

    it("filters contract-systems by visit type select filter", async () => {
        const ids = await harness.filterIds("contract-systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "statusSelect", operation: FilterOperatorTypes.Equal, value: "repair" }]
            }
        });

        expect(ids).toEqual([harness.seedIds.contractSystems.cs1]);
    });
});

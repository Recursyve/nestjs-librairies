import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, describe, expect, it } from "vitest";
import { CharacterizationHarness, getCharacterizationHarness } from "./harness/characterization-harness";

describe("validation and error behavior", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    it("returns 200 with empty values for unknown filter id", async () => {
        const response = await harness.postFilter("persons", {
            page: { number: 0, size: 20 },
            query: {
                condition: "and",
                rules: [{ id: "unknownField", operation: FilterOperatorTypes.Equal, value: "x" }]
            }
        });

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(4);
    });

    it("returns empty array for unknown select config id", async () => {
        const response = await harness.getFilterConfigValue("contract-systems", {
            id: "missingSelect",
            value: "x"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("returns an empty object for unknown select resource id lookup", async () => {
        const response = await harness.getFilterConfigId("contract-systems", {
            id: "missingSelect",
            resourceId: "1"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });
});

/**
 * @p0 legacy-contract
 * Observed: filter-count does not enforce page.size via FilterQueryGuard.
 * Intended: parity with POST /filter validation may be desirable later.
 */
describe("filter-count edge behavior", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    it("accepts filter-count without page.size", async () => {
        const response = await harness.postFilterCount("persons", {
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(response.status).toBe(200);
        expect(harness.parseCountBody(response)).toBe(1);
    });
});

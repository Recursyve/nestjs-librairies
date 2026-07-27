import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededPerson } from "./seeds/create-seeded-person";

describe("validation and error behavior", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("returns 200 with empty values for unknown filter id", async () => {
        await using _a = await createSeededPerson({ email: "a@example.com", first_name: "A", last_name: "One" });
        await using _b = await createSeededPerson({ email: "b@example.com", first_name: "B", last_name: "Two" });
        await using _c = await createSeededPerson({ email: "c@example.com", first_name: "C", last_name: "Three" });
        await using _d = await createSeededPerson({ email: "d@example.com", first_name: "D", last_name: "Four" });

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
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("accepts filter-count without page.size", async () => {
        await using _alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

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

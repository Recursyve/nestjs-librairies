import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededPerson } from "./seeds/create-seeded-person";

describe("validation and error behavior", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns 200 with all rows when filter id is unknown", async () => {
        await using a = await createSeededPerson({ email: "a@example.com", first_name: "A", last_name: "One" });
        await using b = await createSeededPerson({ email: "b@example.com", first_name: "B", last_name: "Two" });
        await using c = await createSeededPerson({ email: "c@example.com", first_name: "C", last_name: "Three" });
        await using d = await createSeededPerson({ email: "d@example.com", first_name: "D", last_name: "Four" });

        const response = await harness.postFilter("persons", {
            page: { number: 0, size: 20 },
            query: {
                condition: "and",
                rules: [{ id: "unknownField", operation: FilterOperatorTypes.Equal, value: "x" }]
            }
        });

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(4);
        expect(response.body.values.map((row: { id: number }) => row.id).sort()).toEqual(
            [a.id, b.id, c.id, d.id].sort()
        );
    });

    it("returns 400 when POST /filter omits page.size", async () => {
        const response = await harness.postFilter("persons", {
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("page size");
    });

    it("returns 400 when POST /filter page.size exceeds maxPage", async () => {
        const response = await harness.postFilter("persons", {
            page: { number: 0, size: 51 },
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("lower than 50");
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

    afterAll(async () => {
        await harness.close();
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

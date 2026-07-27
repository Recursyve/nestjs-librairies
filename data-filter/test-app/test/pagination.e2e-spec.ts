import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededPerson } from "./seeds/create-seeded-person";

describe("pagination", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns the first page with stable id ordering", async () => {
        await using a = await createSeededPerson({ email: "a@example.com", first_name: "A", last_name: "One" });
        await using b = await createSeededPerson({ email: "b@example.com", first_name: "B", last_name: "Two" });
        await using _c = await createSeededPerson({ email: "c@example.com", first_name: "C", last_name: "Three" });
        await using _d = await createSeededPerson({ email: "d@example.com", first_name: "D", last_name: "Four" });

        const response = await harness.postFilter("persons", {
            page: { number: 0, size: 2 },
            order: [{ column: "id", direction: "asc" as const }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        expect(body.total).toBe(4);
        expect(TestHarness.mapFilterRowIds(body)).toEqual([a.id, b.id]);
        expect(body.page).toEqual({ number: 0, size: 2 });
    });

    it("returns the second page disjoint from the first", async () => {
        await using _a = await createSeededPerson({ email: "a@example.com", first_name: "A", last_name: "One" });
        await using _b = await createSeededPerson({ email: "b@example.com", first_name: "B", last_name: "Two" });
        await using c = await createSeededPerson({ email: "c@example.com", first_name: "C", last_name: "Three" });
        await using d = await createSeededPerson({ email: "d@example.com", first_name: "D", last_name: "Four" });

        const firstPage = await harness.postFilter("persons", {
            page: { number: 0, size: 2 },
            order: [{ column: "id", direction: "asc" as const }],
            query: { condition: "and", rules: [] }
        });
        const secondPage = await harness.postFilter("persons", {
            page: { number: 1, size: 2 },
            order: [{ column: "id", direction: "asc" as const }],
            query: { condition: "and", rules: [] }
        });

        expect(secondPage.status).toBe(200);
        const secondBody = TestHarness.parseFilterBody<{ id: number }>(secondPage);
        expect(TestHarness.mapFilterRowIds(secondBody)).toEqual([c.id, d.id]);

        const firstBody = TestHarness.parseFilterBody<{ id: number }>(firstPage);
        const firstIds = TestHarness.mapFilterRowIds(firstBody);
        const secondIds = TestHarness.mapFilterRowIds(secondBody);
        expect(firstIds.every((id) => !secondIds.includes(id))).toBe(true);
    });

    it("honors page offset without overlapping the unskipped window", async () => {
        await using a = await createSeededPerson({ email: "a@example.com", first_name: "A", last_name: "One" });
        await using b = await createSeededPerson({ email: "b@example.com", first_name: "B", last_name: "Two" });
        await using c = await createSeededPerson({ email: "c@example.com", first_name: "C", last_name: "Three" });
        await using d = await createSeededPerson({ email: "d@example.com", first_name: "D", last_name: "Four" });

        const response = await harness.postFilter("persons", {
            page: { number: 0, size: 2, offset: 1 },
            order: [{ column: "id", direction: "asc" as const }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        const ids = TestHarness.mapFilterRowIds(body);
        expect(ids).toEqual([b.id, c.id]);
        expect(ids).not.toContain(a.id);
        expect(ids).not.toContain(d.id);
    });

    it("paginates over a filtered result set with correct totals", async () => {
        await using matchA = await createSeededPerson({
            email: "match-a@example.com",
            first_name: "Filter",
            last_name: "Alpha"
        });
        await using matchB = await createSeededPerson({
            email: "match-b@example.com",
            first_name: "Filter",
            last_name: "Beta"
        });
        await using matchC = await createSeededPerson({
            email: "match-c@example.com",
            first_name: "Filter",
            last_name: "Gamma"
        });
        await using excluded = await createSeededPerson({
            email: "excluded@example.com",
            first_name: "Other",
            last_name: "Delta"
        });

        const filterQuery = {
            condition: "and" as const,
            rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Filter" }]
        };

        const firstPage = await harness.postFilter("persons", {
            page: { number: 0, size: 2 },
            order: [{ column: "id", direction: "asc" as const }],
            query: filterQuery
        });
        const secondPage = await harness.postFilter("persons", {
            page: { number: 1, size: 2 },
            order: [{ column: "id", direction: "asc" as const }],
            query: filterQuery
        });

        expect(firstPage.status).toBe(200);
        const firstBody = TestHarness.parseFilterBody<{ id: number }>(firstPage);
        expect(firstBody.total).toBe(3);
        expect(TestHarness.mapFilterRowIds(firstBody)).toEqual([matchA.id, matchB.id]);

        expect(secondPage.status).toBe(200);
        const secondBody = TestHarness.parseFilterBody<{ id: number }>(secondPage);
        expect(secondBody.total).toBe(3);
        expect(TestHarness.mapFilterRowIds(secondBody)).toEqual([matchC.id]);
        expect(TestHarness.mapFilterRowIds(secondBody)).not.toContain(excluded.id);
    });
});

/**
 * @p0 suspected-defect
 * Observed: pagination combined with ORDER BY on a scalar column fails on MySQL (ER_FIELD_IN_ORDER_NOT_SELECT).
 * Intended: paginated responses should support stable ordering.
 */
describe("pagination with attribute ordering on MySQL", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("currently responds with 500 when ordering by first_name during pagination", async () => {
        await using _person = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const control = await harness.postFilter("persons", {
            page: { number: 10, size: 5 },
            order: [{ column: "id", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });
        expect(control.status).toBe(200);

        const response = await harness.postFilter("persons", {
            page: { number: 10, size: 5 },
            order: [{ column: "first_name", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });
});

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
        await using c = await createSeededPerson({ email: "c@example.com", first_name: "C", last_name: "Three" });
        await using d = await createSeededPerson({ email: "d@example.com", first_name: "D", last_name: "Four" });

        const response = await harness.postFilter("persons", {
            page: { number: 0, size: 2 },
            order: [{ column: "id", direction: "asc" as const }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(4);
        expect(response.body.values.map((row: { id: number }) => row.id)).toEqual([a.id, b.id]);
        expect(response.body.page).toEqual({ number: 0, size: 2 });
    });

    it("returns the second page disjoint from the first", async () => {
        await using a = await createSeededPerson({ email: "a@example.com", first_name: "A", last_name: "One" });
        await using b = await createSeededPerson({ email: "b@example.com", first_name: "B", last_name: "Two" });
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
        expect(secondPage.body.values.map((row: { id: number }) => row.id)).toEqual([c.id, d.id]);

        const firstIds = firstPage.body.values.map((row: { id: number }) => row.id);
        const secondIds = secondPage.body.values.map((row: { id: number }) => row.id);
        expect(firstIds.every((id: number) => !secondIds.includes(id))).toBe(true);
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
        expect(response.body.values.map((row: { id: number }) => row.id)).toEqual([b.id, c.id]);
        expect(response.body.values.map((row: { id: number }) => row.id)).not.toContain(a.id);
        expect(response.body.values.map((row: { id: number }) => row.id)).not.toContain(d.id);
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

        const response = await harness.postFilter("persons", {
            page: { number: 10, size: 5 },
            order: [{ column: "first_name", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });
});

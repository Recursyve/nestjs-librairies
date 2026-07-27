import { beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededPerson } from "./seeds/create-seeded-person";

describe("pagination", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("returns the first page without an explicit order clause", async () => {
        await using _a = await createSeededPerson({ email: "a@example.com", first_name: "A", last_name: "One" });
        await using _b = await createSeededPerson({ email: "b@example.com", first_name: "B", last_name: "Two" });
        await using _c = await createSeededPerson({ email: "c@example.com", first_name: "C", last_name: "Three" });
        await using _d = await createSeededPerson({ email: "d@example.com", first_name: "D", last_name: "Four" });

        const response = await harness.postFilter("persons", {
            page: { number: 0, size: 2 },
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(4);
        expect(response.body.values).toHaveLength(2);
        expect(response.body.page).toEqual({ number: 0, size: 2 });
    });

    it("returns the second page without an explicit order clause", async () => {
        await using _a = await createSeededPerson({ email: "a@example.com", first_name: "A", last_name: "One" });
        await using _b = await createSeededPerson({ email: "b@example.com", first_name: "B", last_name: "Two" });
        await using _c = await createSeededPerson({ email: "c@example.com", first_name: "C", last_name: "Three" });
        await using _d = await createSeededPerson({ email: "d@example.com", first_name: "D", last_name: "Four" });

        const response = await harness.postFilter("persons", {
            page: { number: 1, size: 2 },
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(response.body.values).toHaveLength(2);
    });

    it("honors page offset", async () => {
        await using _a = await createSeededPerson({ email: "a@example.com", first_name: "A", last_name: "One" });
        await using _b = await createSeededPerson({ email: "b@example.com", first_name: "B", last_name: "Two" });
        await using _c = await createSeededPerson({ email: "c@example.com", first_name: "C", last_name: "Three" });
        await using _d = await createSeededPerson({ email: "d@example.com", first_name: "D", last_name: "Four" });

        const response = await harness.postFilter("persons", {
            page: { number: 0, size: 2, offset: 1 },
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(response.body.values).toHaveLength(2);
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

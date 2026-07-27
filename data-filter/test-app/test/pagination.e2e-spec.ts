import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CharacterizationHarness, getCharacterizationHarness } from "./harness/characterization-harness";

describe("pagination", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("returns the first page without an explicit order clause", async () => {
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
        const response = await harness.postFilter("persons", {
            page: { number: 1, size: 2 },
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(response.body.values).toHaveLength(2);
    });

    it("honors page offset", async () => {
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
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    it("currently responds with 500 when ordering by first_name during pagination", async () => {
        const response = await harness.postFilter("persons", {
            page: { number: 10, size: 5 },
            order: [{ column: "first_name", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });
});

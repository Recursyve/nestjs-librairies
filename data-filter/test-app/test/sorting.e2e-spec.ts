import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CharacterizationHarness, defaultPage, getCharacterizationHarness } from "./harness/characterization-harness";

/**
 * @p0 suspected-defect
 * Observed: ORDER BY (attribute columns and order-rules) combined with DISTINCT id pagination fails on MySQL.
 * Intended: order rules should sort results without database errors.
 */
describe("sorting and order rules on MySQL", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("currently responds with 500 when ordering persons by first_name", async () => {
        const response = await harness.postFilter("persons", {
            page: defaultPage,
            order: [{ column: "first_name", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });

    it("currently responds with 500 when ordering products by enum order rule", async () => {
        const response = await harness.postFilter("products", {
            page: defaultPage,
            order: [{ column: "statusOrder", direction: "desc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });

    it("currently responds with 500 when ordering persons by is-null order rule", async () => {
        const response = await harness.postFilter("persons", {
            page: defaultPage,
            order: [{ column: "lastNameNullOrder", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });

    it("currently responds with 500 when ordering persons by if order rule", async () => {
        const response = await harness.postFilter("persons", {
            page: defaultPage,
            order: [{ column: "emailIfOrder", direction: "desc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });
});

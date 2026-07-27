import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededProduct } from "./seeds/create-seeded-product";

/**
 * @p0 suspected-defect
 * Observed: ORDER BY (attribute columns and order-rules) combined with DISTINCT id pagination fails on MySQL.
 * Intended: order rules should sort results without database errors.
 */
describe("sorting and order rules on MySQL", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("currently responds with 500 when ordering persons by first_name", async () => {
        await using _person = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "first_name", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });

    it("currently responds with 500 when ordering products by enum order rule", async () => {
        await using _product = await createSeededProduct({
            metadata: { category: "electronics" },
            name: "Widget",
            sku: "WDG-001",
            status: "active",
            stock: 1,
            tags: []
        });

        const response = await harness.postFilter("products", {
            page: TestHarness.defaultPage,
            order: [{ column: "statusOrder", direction: "desc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });

    it("currently responds with 500 when ordering persons by is-null order rule", async () => {
        await using _person = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "lastNameNullOrder", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });

    it("currently responds with 500 when ordering persons by if order rule", async () => {
        await using _person = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "emailIfOrder", direction: "desc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(500);
    });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededProduct } from "./seeds/create-seeded-product";

describe("sorting on MySQL", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("orders persons by id descending", async () => {
        await using first = await createSeededPerson({
            email: "first@example.com",
            first_name: "First",
            last_name: "One"
        });
        await using second = await createSeededPerson({
            email: "second@example.com",
            first_name: "Second",
            last_name: "Two"
        });
        await using third = await createSeededPerson({
            email: "third@example.com",
            first_name: "Third",
            last_name: "Three"
        });

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "id", direction: "desc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        expect(TestHarness.mapFilterRowIds(body)).toEqual([third.id, second.id, first.id]);
    });
});

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

        const control = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(control.status).toBe(200);

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "first_name", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });

    /**
     * @p0 suspected-defect
     * Observed: EnumOrderRule getOrderOption uses a synchronous loop; mutating ++i to --i is non-terminating
     * and cannot be distinguished in-process via HTTP assertions (Stryker timeout finding).
     */
    it("currently responds with 500 when ordering products by enum order rule", async () => {
        await using _product = await createSeededProduct({
            metadata: { category: "electronics" },
            name: "Widget",
            sku: "WDG-001",
            status: "active",
            stock: 1,
            tags: []
        });

        const control = await harness.postFilter("products", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(control.status).toBe(200);

        const response = await harness.postFilter("products", {
            page: TestHarness.defaultPage,
            order: [{ column: "statusOrder", direction: "desc" }],
            query: { condition: "and", rules: [] }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });

    it("currently responds with 500 when ordering persons by is-null order rule", async () => {
        await using _person = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const control = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(control.status).toBe(200);

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "lastNameNullOrder", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });

    it("currently responds with 500 when ordering persons by if order rule", async () => {
        await using _person = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const control = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(control.status).toBe(200);

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "emailIfOrder", direction: "desc" }],
            query: { condition: "and", rules: [] }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });
});

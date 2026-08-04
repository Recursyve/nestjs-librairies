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

describe("sorting and order rules on MySQL", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("orders persons by first_name ascending", async () => {
        await using charlie = await createSeededPerson({
            email: "charlie@example.com",
            first_name: "Charlie",
            last_name: "C"
        });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "A"
        });
        await using bob = await createSeededPerson({
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "B"
        });

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "first_name", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        const ids = TestHarness.mapFilterRowIds(body).filter((id) =>
            [alice.id, bob.id, charlie.id].includes(id)
        );
        expect(ids).toEqual([alice.id, bob.id, charlie.id]);
    });

    it("orders products by enum order rule descending", async () => {
        await using active = await createSeededProduct({
            metadata: { category: "electronics" },
            name: "Active widget",
            sku: "WDG-ACTIVE",
            status: "active",
            stock: 1,
            tags: []
        });
        await using pending = await createSeededProduct({
            metadata: { category: "electronics" },
            name: "Pending widget",
            sku: "WDG-PENDING",
            status: "pending",
            stock: 1,
            tags: []
        });
        await using inactive = await createSeededProduct({
            metadata: { category: "electronics" },
            name: "Inactive widget",
            sku: "WDG-INACTIVE",
            status: "inactive",
            stock: 1,
            tags: []
        });

        const response = await harness.postFilter("products", {
            page: TestHarness.defaultPage,
            order: [{ column: "statusOrder", direction: "desc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        const ids = TestHarness.mapFilterRowIds(body).filter((id) =>
            [active.id, pending.id, inactive.id].includes(id)
        );
        expect(ids).toEqual([active.id, pending.id, inactive.id]);
    });

    it("orders persons by is-null order rule ascending", async () => {
        await using withLastName = await createSeededPerson({
            email: "named@example.com",
            first_name: "Named",
            last_name: "Person"
        });
        await using withoutLastName = await createSeededPerson({
            email: "noname@example.com",
            first_name: "No"
        });

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "lastNameNullOrder", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        const ids = TestHarness.mapFilterRowIds(body).filter((id) =>
            [withLastName.id, withoutLastName.id].includes(id)
        );
        expect(ids).toEqual([withLastName.id, withoutLastName.id]);
    });

    it("orders persons by if order rule descending", async () => {
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using other = await createSeededPerson({
            email: "other@example.com",
            first_name: "Other",
            last_name: "User"
        });

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            order: [{ column: "emailIfOrder", direction: "desc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        const ids = TestHarness.mapFilterRowIds(body).filter((id) => [alice.id, other.id].includes(id));
        expect(ids).toEqual([alice.id, other.id]);
    });
});

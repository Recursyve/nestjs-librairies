import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededProduct } from "./seeds/create-seeded-product";

describe("search", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("searches persons by first name token", async () => {
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using bob = await createSeededPerson({
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            search: { value: "Alice" },
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([alice.id]);
        expect(ids).not.toContain(bob.id);
    });

    it("searches persons across nested address fields", async () => {
        await using location = await createSeededLocation({ value: "Quebec", unique_code: "QC" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 50,
            address: "50 Rue Saint-Jean",
            postal_code: "G1R1P5"
        });
        await using bob = await createSeededPerson({
            coord_id: coord.id,
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            search: { value: "Saint-Jean" },
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([bob.id]);
        expect(ids).not.toContain(alice.id);
    });

    it("matches multiple tokens with AND semantics on persons search", async () => {
        await using bob = await createSeededPerson({
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });
        await using bobAlpha = await createSeededPerson({
            email: "bob.alpha@example.com",
            first_name: "Bob",
            last_name: "Alp ha"
        });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using charlieBeta = await createSeededPerson({
            email: "charlie@example.com",
            first_name: "Charlie",
            last_name: "Beta"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            search: { value: "Bob Beta" },
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([bob.id]);
        expect(ids).not.toContain(bobAlpha.id);
        expect(ids).not.toContain(alice.id);
        expect(ids).not.toContain(charlieBeta.id);
    });

    it("searches products by sku", async () => {
        await using widget = await createSeededProduct({
            metadata: { brand: "Acme", category: "electronics", rating: 5 },
            name: "Widget Pro",
            sku: "WDG-001",
            status: "active",
            stock: 10,
            tags: ["new", "featured"]
        });
        await using gadget = await createSeededProduct({
            metadata: { brand: "BetaCorp", category: "electronics" },
            name: "Gadget Basic",
            sku: "GDG-002",
            status: "pending",
            stock: 0,
            tags: ["sale"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            search: { value: "WDG-001" },
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([widget.id]);
        expect(ids).not.toContain(gadget.id);
    });

    it("searches products by JSON metadata content", async () => {
        await using widget = await createSeededProduct({
            metadata: { brand: "Acme", category: "electronics", rating: 5 },
            name: "Widget Pro",
            sku: "WDG-001",
            status: "active",
            stock: 10,
            tags: ["new", "featured"]
        });
        await using gadget = await createSeededProduct({
            metadata: { brand: "BetaCorp", category: "electronics" },
            name: "Gadget Basic",
            sku: "GDG-002",
            status: "pending",
            stock: 0,
            tags: ["sale"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            search: { value: "BetaCorp" },
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([gadget.id]);
        expect(ids).not.toContain(widget.id);
    });
});

describe("search combined with filters", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("applies search and filter rules together", async () => {
        await using both = await createSeededPerson({
            email: "alice.search@example.com",
            first_name: "Alice",
            last_name: "Searchable"
        });
        await using filterOnly = await createSeededPerson({
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "FilterOnly"
        });
        await using searchOnly = await createSeededPerson({
            email: "charlie.search@example.com",
            first_name: "Charlie",
            last_name: "Gamma"
        });
        await using neither = await createSeededPerson({
            email: "outsider@otherdomain.com",
            first_name: "Outside",
            last_name: "World"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            search: { value: "search" },
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(ids).toEqual([both.id]);
        expect(ids).not.toContain(filterOnly.id);
        expect(ids).not.toContain(searchOnly.id);
        expect(ids).not.toContain(neither.id);
    });
});

describe("search with pagination", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("paginates search matches with stable ordering and disjoint pages", async () => {
        await using alpha = await createSeededPerson({
            email: "alpha.team@example.com",
            first_name: "Alpha",
            last_name: "Team"
        });
        await using beta = await createSeededPerson({
            email: "beta.team@example.com",
            first_name: "Beta",
            last_name: "Team"
        });
        await using gamma = await createSeededPerson({
            email: "gamma.team@example.com",
            first_name: "Gamma",
            last_name: "Team"
        });
        await using outsider = await createSeededPerson({
            email: "outsider@otherdomain.com",
            first_name: "Outside",
            last_name: "World"
        });

        const firstPage = await harness.postFilter("persons", {
            page: { number: 0, size: 1 },
            order: [{ column: "id", direction: "asc" }],
            search: { value: "team" },
            query: { condition: "and", rules: [] }
        });
        const secondPage = await harness.postFilter("persons", {
            page: { number: 1, size: 1 },
            order: [{ column: "id", direction: "asc" }],
            search: { value: "team" },
            query: { condition: "and", rules: [] }
        });
        const thirdPage = await harness.postFilter("persons", {
            page: { number: 2, size: 1 },
            order: [{ column: "id", direction: "asc" }],
            search: { value: "team" },
            query: { condition: "and", rules: [] }
        });

        expect(firstPage.status).toBe(200);
        const firstBody = TestHarness.parseFilterBody<{ id: number }>(firstPage);
        expect(firstBody.total).toBe(3);
        expect(TestHarness.mapFilterRowIds(firstBody)).toEqual([alpha.id]);

        expect(secondPage.status).toBe(200);
        const secondBody = TestHarness.parseFilterBody<{ id: number }>(secondPage);
        expect(TestHarness.mapFilterRowIds(secondBody)).toEqual([beta.id]);

        expect(thirdPage.status).toBe(200);
        const thirdBody = TestHarness.parseFilterBody<{ id: number }>(thirdPage);
        expect(TestHarness.mapFilterRowIds(thirdBody)).toEqual([gamma.id]);

        const allIds = [...firstBody.values, ...secondBody.values, ...thirdBody.values].map((row) => row.id);
        expect(allIds).not.toContain(outsider.id);
        expect(new Set(allIds).size).toBe(3);
    });
});

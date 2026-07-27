import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededProduct } from "./seeds/create-seeded-product";

describe("string operators", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters with contains on email", async () => {
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
        await using charlie = await createSeededPerson({
            email: "charlie@example.com",
            first_name: "Charlie",
            last_name: "Gamma"
        });
        await using diana = await createSeededPerson({
            email: "diana@example.com",
            first_name: "Diana"
        });

        await using outsider = await createSeededPerson({
            email: "outsider@otherdomain.com",
            first_name: "Outside",
            last_name: "World"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "email", operation: FilterOperatorTypes.Contains, value: "example.com" }]
            }
        });

        expect(ids.sort()).toEqual([alice.id, bob.id, charlie.id, diana.id].sort());
        expect(ids).not.toContain(outsider.id);
    });

    it("filters with begins_with on first name", async () => {
        await using charlie = await createSeededPerson({
            email: "charlie@example.com",
            first_name: "Charlie",
            last_name: "Gamma"
        });
        await using arcChael = await createSeededPerson({
            email: "arc@example.com",
            first_name: "ArcChael",
            last_name: "Middle"
        });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.BeginsWith, value: "Ch" }]
            }
        });

        expect(ids).toEqual([charlie.id]);
        expect(ids).not.toContain(arcChael.id);
        expect(ids).not.toContain(alice.id);
    });

    it("filters with ends_with on email", async () => {
        await using bob = await createSeededPerson({
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using middleDomain = await createSeededPerson({
            email: "user@example.com@backup.org",
            first_name: "Middle",
            last_name: "Domain"
        });
        await using prefixDomain = await createSeededPerson({
            email: "prefix-bob@example.com",
            first_name: "Prefix",
            last_name: "Domain"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "email", operation: FilterOperatorTypes.EndsWith, value: "@example.com" }]
            }
        });

        expect(ids.sort()).toEqual([alice.id, bob.id, prefixDomain.id].sort());
        expect(ids).not.toContain(middleDomain.id);
    });

    it("filters with not_begins_with on first name", async () => {
        await using charlie = await createSeededPerson({
            email: "charlie@example.com",
            first_name: "Charlie",
            last_name: "Gamma"
        });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.NotBeginsWith, value: "Ch" }]
            }
        });

        expect(ids).toEqual([alice.id]);
        expect(ids).not.toContain(charlie.id);
    });

    it("filters with not_ends_with on email", async () => {
        await using bob = await createSeededPerson({
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using middleDomain = await createSeededPerson({
            email: "user@example.com@backup.org",
            first_name: "Middle",
            last_name: "Domain"
        });
        await using prefixDomain = await createSeededPerson({
            email: "prefix-bob@example.com",
            first_name: "Prefix",
            last_name: "Domain"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "email", operation: FilterOperatorTypes.NotEndsWith, value: "@example.com" }]
            }
        });

        expect(ids).toEqual([middleDomain.id]);
        expect(ids).not.toContain(bob.id);
        expect(ids).not.toContain(alice.id);
        expect(ids).not.toContain(prefixDomain.id);
    });

    it("filters with not_contains on city", async () => {
        await using montrealLocation = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using quebecLocation = await createSeededLocation({ value: "Quebec", unique_code: "QC" });
        await using torontoLocation = await createSeededLocation({ value: "Toronto", unique_code: "TOR" });
        await using montrealCoord = await createSeededCoords({
            location_id: montrealLocation.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1"
        });
        await using quebecCoord = await createSeededCoords({
            location_id: quebecLocation.id,
            street_number: 50,
            address: "50 Rue Saint-Jean",
            postal_code: "G1R1P5"
        });
        await using torontoCoord = await createSeededCoords({
            location_id: torontoLocation.id,
            street_number: 200,
            address: "200 King Street",
            postal_code: "M5H1A1"
        });
        await using _alice = await createSeededPerson({
            coord_id: montrealCoord.id,
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using bob = await createSeededPerson({
            coord_id: quebecCoord.id,
            email: "bob@example.com",
            first_name: "Bob",
            last_name: "Beta"
        });
        await using _charlie = await createSeededPerson({
            coord_id: montrealCoord.id,
            email: "charlie@example.com",
            first_name: "Charlie",
            last_name: "Gamma"
        });
        await using diana = await createSeededPerson({
            coord_id: torontoCoord.id,
            email: "diana@example.com",
            first_name: "Diana"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "city", operation: FilterOperatorTypes.NotContains, value: "Montreal" }]
            }
        });

        expect(ids.sort()).toEqual([bob.id, diana.id].sort());
    });

    it("filters with is_empty on first name", async () => {
        await using emptyName = await createSeededPerson({
            email: "empty@example.com",
            first_name: "",
            last_name: "Empty"
        });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.IsEmpty, value: null }]
            }
        });

        expect(ids).toEqual([emptyName.id]);
        expect(ids).not.toContain(alice.id);
    });

    it("filters with is_not_empty on first name", async () => {
        await using emptyName = await createSeededPerson({
            email: "empty@example.com",
            first_name: "",
            last_name: "Empty"
        });
        await using alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.IsNotEmpty, value: null }]
            }
        });

        expect(ids).toEqual([alice.id]);
        expect(ids).not.toContain(emptyName.id);
    });
});

describe("IN / NOT IN operators", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters products with in on status", async () => {
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
        await using _manual = await createSeededProduct({
            metadata: { category: "books", language: "en" },
            name: "Operator Manual",
            sku: "BK-003",
            status: "inactive",
            stock: 25,
            tags: ["used"]
        });
        await using legacy = await createSeededProduct({
            metadata: { category: "legacy" },
            name: "Legacy Item",
            sku: "LEG-004",
            status: "active",
            tags: ["legacy"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "status", operation: FilterOperatorTypes.In, value: ["active", "pending"] }]
            }
        });

        expect(ids.sort()).toEqual([widget.id, gadget.id, legacy.id].sort());
    });

    it("filters products with not_in on status", async () => {
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
        await using _manual = await createSeededProduct({
            metadata: { category: "books", language: "en" },
            name: "Operator Manual",
            sku: "BK-003",
            status: "inactive",
            stock: 25,
            tags: ["used"]
        });
        await using legacy = await createSeededProduct({
            metadata: { category: "legacy" },
            name: "Legacy Item",
            sku: "LEG-004",
            status: "active",
            tags: ["legacy"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "status", operation: FilterOperatorTypes.NotIn, value: ["inactive"] }]
            }
        });

        expect(ids.sort()).toEqual([widget.id, gadget.id, legacy.id].sort());
    });
});

describe("NULL behavior", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters persons with is_null on last name", async () => {
        await using diana = await createSeededPerson({
            email: "diana@example.com",
            first_name: "Diana"
        });
        await using _alice = await createSeededPerson({
            email: "alice@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "lastName", operation: FilterOperatorTypes.IsNull, value: null }]
            }
        });

        expect(ids).toEqual([diana.id]);
    });

    it("filters persons with is_not_null on last name", async () => {
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
        await using charlie = await createSeededPerson({
            email: "charlie@example.com",
            first_name: "Charlie",
            last_name: "Gamma"
        });
        await using _diana = await createSeededPerson({
            email: "diana@example.com",
            first_name: "Diana"
        });

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "lastName", operation: FilterOperatorTypes.IsNotNull, value: null }]
            }
        });

        expect(ids.sort()).toEqual([alice.id, bob.id, charlie.id].sort());
    });

    it("filters products with is_null on stock", async () => {
        await using legacy = await createSeededProduct({
            metadata: { category: "legacy" },
            name: "Legacy Item",
            sku: "LEG-004",
            status: "active",
            tags: ["legacy"]
        });
        await using _widget = await createSeededProduct({
            metadata: { brand: "Acme", category: "electronics", rating: 5 },
            name: "Widget Pro",
            sku: "WDG-001",
            status: "active",
            stock: 10,
            tags: ["new", "featured"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "stock", operation: FilterOperatorTypes.IsNull, value: null }]
            }
        });

        expect(ids).toEqual([legacy.id]);
    });
});

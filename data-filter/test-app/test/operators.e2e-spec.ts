import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededContract } from "./seeds/create-seeded-contract";
import { createSeededContractSystem } from "./seeds/create-seeded-contract-system";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededInvoice } from "./seeds/create-seeded-invoice";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededPlace } from "./seeds/create-seeded-place";
import { createSeededProduct } from "./seeds/create-seeded-product";
import { createSeededSystem } from "./seeds/create-seeded-system";

describe("equality / inequality operators", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("filters persons with equal on first name", async () => {
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
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(ids).toEqual([alice.id]);
    });

    it("filters persons with not_equal on first name", async () => {
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

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.NotEqual, value: "Alice" }]
            }
        });

        expect(ids.sort()).toEqual([bob.id, charlie.id, diana.id].sort());
    });
});

describe("numeric comparisons", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("filters products with greater on stock", async () => {
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
        await using manual = await createSeededProduct({
            metadata: { category: "books", language: "en" },
            name: "Operator Manual",
            sku: "BK-003",
            status: "inactive",
            stock: 25,
            tags: ["used"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "stock", operation: FilterOperatorTypes.Greater, value: 10 }]
            }
        });

        expect(ids).toEqual([manual.id]);
    });

    it("filters products with less_or_equal on stock", async () => {
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
        await using manual = await createSeededProduct({
            metadata: { category: "books", language: "en" },
            name: "Operator Manual",
            sku: "BK-003",
            status: "inactive",
            stock: 25,
            tags: ["used"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "stock", operation: FilterOperatorTypes.LessOrEqual, value: 10 }]
            }
        });

        expect(ids.sort()).toEqual([gadget.id, widget.id].sort());
    });
});

describe("date comparisons on nested contract paths", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("filters contract-systems with greater_or_equal on contract start date", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1"
        });
        await using place = await createSeededPlace({
            billing_coord_id: coord.id,
            geo_coord_id: coord.id
        });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-001",
            latitude: 45.5017,
            longitude: -73.5673
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-001",
            paid: true,
            subtotal: 1000,
            total_cost: 1150
        });
        await using contract = await createSeededContract({
            invoice_id: invoice.id,
            start_date: "2024-06-01",
            end_date: "2025-12-31",
            payable_by: "2024-07-01",
            total_cost: 1150
        });
        await using cs = await createSeededContractSystem({
            contract_id: contract.id,
            system_id: system.id,
            active: true,
            activated_date: "2024-06-01"
        });

        const ids = await harness.filterIds("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "contractStart", operation: FilterOperatorTypes.GreaterOrEqual, value: "2024-01-01" }]
            }
        });

        expect(ids).toEqual([cs.id]);
    });

    it("filters contract-systems with between on contract start date for expired contract", async () => {
        await using location = await createSeededLocation({ value: "Toronto", unique_code: "TOR" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 200,
            address: "200 King Street",
            postal_code: "M5H1A1"
        });
        await using place = await createSeededPlace({
            billing_coord_id: coord.id,
            geo_coord_id: coord.id
        });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-TO-003",
            latitude: 43.6532,
            longitude: -79.3832
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-003",
            paid: false,
            subtotal: 500,
            total_cost: 575
        });
        await using contract = await createSeededContract({
            invoice_id: invoice.id,
            start_date: "2020-01-01",
            end_date: "2020-12-31",
            payable_by: "2020-02-01",
            total_cost: 575
        });
        await using cs = await createSeededContractSystem({
            contract_id: contract.id,
            system_id: system.id,
            active: false,
            activated_date: "2020-01-01"
        });

        const ids = await harness.filterIds("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "contractStart",
                        operation: FilterOperatorTypes.Between,
                        value: ["2019-12-31", "2021-01-02"]
                    }
                ]
            }
        });

        expect(ids).toEqual([cs.id]);
    });
});

import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

    afterAll(async () => {
        await harness.close();
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
        expect(ids).not.toContain(alice.id);
    });

    it("filters persons with OR across first names", async () => {
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

        const ids = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: {
                condition: "or",
                rules: [
                    { id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" },
                    { id: "firstName", operation: FilterOperatorTypes.Equal, value: "Charlie" }
                ]
            }
        });

        expect(ids.sort()).toEqual([alice.id, charlie.id].sort());
        expect(ids).not.toContain(bob.id);
    });

    it("filters persons with nested AND/OR groups", async () => {
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
                rules: [
                    {
                        condition: "or",
                        rules: [
                            { id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" },
                            { id: "firstName", operation: FilterOperatorTypes.Equal, value: "Charlie" }
                        ]
                    },
                    { id: "lastName", operation: FilterOperatorTypes.IsNotNull, value: null }
                ]
            }
        });

        expect(ids.sort()).toEqual([alice.id, charlie.id].sort());
        expect(ids).not.toContain(bob.id);
        expect(ids).not.toContain(diana.id);
    });
});

describe("numeric comparisons", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
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
        expect(ids).not.toContain(widget.id);
        expect(ids).not.toContain(gadget.id);
    });

    it("filters products with less on stock", async () => {
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
                rules: [{ id: "stock", operation: FilterOperatorTypes.Less, value: 10 }]
            }
        });

        expect(ids).toEqual([gadget.id]);
        expect(ids).not.toContain(widget.id);
        expect(ids).not.toContain(manual.id);
    });

    it("filters products with greater_or_equal on stock", async () => {
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
                rules: [{ id: "stock", operation: FilterOperatorTypes.GreaterOrEqual, value: 10 }]
            }
        });

        expect(ids.sort()).toEqual([widget.id, manual.id].sort());
        expect(ids).not.toContain(gadget.id);
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
        expect(ids).not.toContain(manual.id);
    });
});

describe("date comparisons on nested contract paths", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
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

        await using oldLocation = await createSeededLocation({ value: "Toronto", unique_code: "TOR-OLD" });
        await using oldCoord = await createSeededCoords({
            location_id: oldLocation.id,
            street_number: 201,
            address: "201 King Street",
            postal_code: "M5H1A1"
        });
        await using oldPlace = await createSeededPlace({
            billing_coord_id: oldCoord.id,
            geo_coord_id: oldCoord.id
        });
        await using oldSystem = await createSeededSystem({
            place_id: oldPlace.id,
            file_number: "SYS-OLD",
            latitude: 43.6532,
            longitude: -79.3832
        });
        await using oldInvoice = await createSeededInvoice({
            invoice_number: "INV-OLD",
            paid: false,
            subtotal: 500,
            total_cost: 575
        });
        await using oldContract = await createSeededContract({
            invoice_id: oldInvoice.id,
            start_date: "2019-01-01",
            end_date: "2019-12-31",
            payable_by: "2019-02-01",
            total_cost: 575
        });
        await using _oldCs = await createSeededContractSystem({
            contract_id: oldContract.id,
            system_id: oldSystem.id,
            active: false,
            activated_date: "2019-01-01"
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

    it("filters contract-systems with equal on contract start date", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL-EQ" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 110,
            address: "110 Main Street",
            postal_code: "H1A1A1"
        });
        await using place = await createSeededPlace({
            billing_coord_id: coord.id,
            geo_coord_id: coord.id
        });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-EQ",
            latitude: 45.5017,
            longitude: -73.5673
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-EQ",
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

        await using otherLocation = await createSeededLocation({ value: "Quebec", unique_code: "QC-EQ" });
        await using otherCoord = await createSeededCoords({
            location_id: otherLocation.id,
            street_number: 120,
            address: "120 Rue Saint-Jean",
            postal_code: "G1R1R1"
        });
        await using otherPlace = await createSeededPlace({
            billing_coord_id: otherCoord.id,
            geo_coord_id: otherCoord.id
        });
        await using otherSystem = await createSeededSystem({
            place_id: otherPlace.id,
            file_number: "SYS-OTHER",
            latitude: 46.8139,
            longitude: -71.208
        });
        await using otherInvoice = await createSeededInvoice({
            invoice_number: "INV-OTHER",
            paid: true,
            subtotal: 500,
            total_cost: 575
        });
        await using otherContract = await createSeededContract({
            invoice_id: otherInvoice.id,
            start_date: "2024-07-01",
            end_date: "2025-12-31",
            payable_by: "2024-08-01",
            total_cost: 575
        });
        await using _otherCs = await createSeededContractSystem({
            contract_id: otherContract.id,
            system_id: otherSystem.id,
            active: true,
            activated_date: "2024-07-01"
        });

        const ids = await harness.filterIds("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "contractStart", operation: FilterOperatorTypes.Equal, value: "2024-06-01" }]
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

    it("filters contract-systems with not_between on contract start date", async () => {
        await using location = await createSeededLocation({ value: "Toronto", unique_code: "TOR-NB" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 210,
            address: "210 King Street",
            postal_code: "M5H1A1"
        });
        await using place = await createSeededPlace({
            billing_coord_id: coord.id,
            geo_coord_id: coord.id
        });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-NB",
            latitude: 43.6532,
            longitude: -79.3832
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-NB",
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

        await using recentLocation = await createSeededLocation({ value: "Montreal", unique_code: "MTL-NB" });
        await using recentCoord = await createSeededCoords({
            location_id: recentLocation.id,
            street_number: 211,
            address: "211 Main Street",
            postal_code: "H1A1A1"
        });
        await using recentPlace = await createSeededPlace({
            billing_coord_id: recentCoord.id,
            geo_coord_id: recentCoord.id
        });
        await using recentSystem = await createSeededSystem({
            place_id: recentPlace.id,
            file_number: "SYS-RECENT",
            latitude: 45.5017,
            longitude: -73.5673
        });
        await using recentInvoice = await createSeededInvoice({
            invoice_number: "INV-RECENT",
            paid: true,
            subtotal: 1000,
            total_cost: 1150
        });
        await using recentContract = await createSeededContract({
            invoice_id: recentInvoice.id,
            start_date: "2024-06-01",
            end_date: "2025-12-31",
            payable_by: "2024-07-01",
            total_cost: 1150
        });
        await using recentCs = await createSeededContractSystem({
            contract_id: recentContract.id,
            system_id: recentSystem.id,
            active: true,
            activated_date: "2024-06-01"
        });

        const ids = await harness.filterIds("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "contractStart",
                        operation: FilterOperatorTypes.NotBetween,
                        value: ["2019-12-31", "2021-01-02"]
                    }
                ]
            }
        });

        expect(ids).toEqual([recentCs.id]);
        expect(ids).not.toContain(cs.id);
    });
});

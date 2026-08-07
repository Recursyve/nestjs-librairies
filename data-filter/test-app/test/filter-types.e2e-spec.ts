import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededContract } from "./seeds/create-seeded-contract";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededInvoice } from "./seeds/create-seeded-invoice";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededPlace } from "./seeds/create-seeded-place";
import { createSeededProduct } from "./seeds/create-seeded-product";
import { createSeededSystem } from "./seeds/create-seeded-system";

const montrealCenter = { type: "Point" as const, coordinates: [-73.5673, 45.5017] as [number, number] };

function aclUser(allowedPersonIds: number[]) {
    return { id: "test-user", allowedPersonIds };
}

describe("translation search", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("searches products by JSON translation field for the user language", async () => {
        await using french = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Widget FR",
            sku: "FR-001",
            status: "active",
            stock: 1,
            tags: ["a"],
            translations: { fr: "Bonjour", en: "Hello" }
        });
        await using english = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Widget EN",
            sku: "EN-001",
            status: "active",
            stock: 1,
            tags: ["a"],
            translations: { fr: "Salut", en: "Greetings" }
        });

        const ids = await harness.filterIds(
            "products",
            {
                page: TestHarness.defaultPage,
                search: { value: "Bonjour" },
                query: { condition: "and", rules: [] }
            },
            { id: "fr-user", language: "fr" }
        );

        expect(ids).toEqual([french.id]);
        expect(ids).not.toContain(english.id);
    });
});

describe("empty search semantics", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns the same rows for empty search value as omitting search", async () => {
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

        const withoutSearch = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        const emptySearch = await harness.filterIds("persons", {
            page: TestHarness.defaultPage,
            search: { value: "" },
            query: { condition: "and", rules: [] }
        });

        expect(emptySearch.sort()).toEqual(withoutSearch.sort());
        expect(emptySearch.sort()).toEqual([first.id, second.id].sort());
    });
});

/**
 * @p0 suspected-defect
 * Observed: groupBy on filter requests currently responds with HTTP 500 on MySQL.
 */
describe("groupBy query option", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns HTTP 500 when groupBy is provided", async () => {
        await using _alpha = await createSeededPerson({
            email: "alpha@example.com",
            first_name: "Alpha",
            last_name: "GroupA"
        });

        const response = await harness.postFilter("persons", {
            page: TestHarness.defaultPage,
            groupBy: "last_name",
            query: { condition: "and", rules: [] }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });
});

describe("per-filter disableAccessControl", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns all invoice rows even when a deserialized ACL user is present", async () => {
        await using first = await createSeededInvoice({
            invoice_number: "INV-001",
            paid: true,
            subtotal: 100,
            total_cost: 110
        });
        await using second = await createSeededInvoice({
            invoice_number: "INV-002",
            paid: false,
            subtotal: 50,
            total_cost: 55
        });

        const response = await harness.postFilter(
            "invoices",
            {
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            },
            aclUser([first.id])
        );

        expect(response.status).toBe(200);
        const ids = TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response));
        expect(ids.sort()).toEqual([first.id, second.id].sort());
    });
});

describe("download without export columns", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("downloads location rows through the no-export-columns download path", async () => {
        await using montreal = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using _quebec = await createSeededLocation({ value: "Quebec", unique_code: "QC" });

        const filterResponse = await harness.postFilter("locations", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "uniqueCode", operation: FilterOperatorTypes.Equal, value: "MTL" }]
            }
        });
        const downloadResponse = await harness.postDownload("locations", "csv", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "uniqueCode", operation: FilterOperatorTypes.Equal, value: "MTL" }]
            }
        });

        expect(filterResponse.status).toBe(200);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(filterResponse))).toEqual([
            montreal.id
        ]);
        expect(downloadResponse.status).toBe(200);
        expect(downloadResponse.text.length).toBeGreaterThan(0);
        expect(downloadResponse.text).not.toMatch(/exports\./);
    });
});

/**
 * @p0 suspected-defect
 * Observed: geo-bounds on MySQL currently returns empty sets for covering polygons.
 */
describe("geo-bounds public modes", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns HTTP 500 for geo_point attribute bounds with SRID", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL-GB" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 10,
            address: "10 Main",
            postal_code: "H1A1A1",
            geo_point: montrealCenter
        });

        const polygon: [number, number][] = [
            [44.0, -75.0],
            [44.0, -72.0],
            [47.0, -72.0],
            [47.0, -75.0]
        ];

        const response = await harness.postFilter("coords", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "geoPointBounds", operation: FilterOperatorTypes.Equal, value: polygon }]
            }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
        expect(coord.id).toBeGreaterThan(0);
    });

    it("returns systems inside a covering polygon when geo bounds use not_equal", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL-NE" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 20,
            address: "20 Main",
            postal_code: "H1A1A2",
            geo_point: montrealCenter
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-NE-001",
            latitude: 45.5017,
            longitude: -73.5673
        });

        const polygon: [number, number][] = [
            [44.0, -75.0],
            [44.0, -72.0],
            [47.0, -72.0],
            [47.0, -75.0]
        ];

        const ids = await harness.filterIds("systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "geoBounds", operation: FilterOperatorTypes.NotEqual, value: polygon }]
            }
        });

        expect(ids).toEqual([system.id]);
    });
});

describe("DateOnly filter type", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters contracts by start_date using DateOnlyFilter", async () => {
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-DO-1",
            paid: true,
            subtotal: 100,
            total_cost: 110
        });
        await using june = await createSeededContract({
            invoice_id: invoice.id,
            start_date: "2024-06-01",
            end_date: "2024-12-31",
            payable_by: "2024-07-01",
            total_cost: 1000
        });
        await using july = await createSeededContract({
            invoice_id: invoice.id,
            start_date: "2024-07-01",
            end_date: "2024-12-31",
            payable_by: "2024-08-01",
            total_cost: 2000
        });

        const ids = await harness.filterIds("contracts", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "startDate", operation: FilterOperatorTypes.Equal, value: "2024-06-01" }]
            }
        });

        expect(ids).toEqual([june.id]);
        expect(ids).not.toContain(july.id);
    });
});

describe("DateTime, Options, and Group filter types", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters products by DateTimeFilter on listed_at", async () => {
        await using early = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Early",
            sku: "DT-EARLY",
            status: "active",
            stock: 1,
            tags: ["a"],
            listed_at: "2024-01-15T10:00:00.000Z"
        });
        await using late = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Late",
            sku: "DT-LATE",
            status: "active",
            stock: 1,
            tags: ["a"],
            listed_at: "2024-06-15T10:00:00.000Z"
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "listedAt",
                        operation: FilterOperatorTypes.GreaterOrEqual,
                        value: "2024-06-01T00:00:00.000Z"
                    }
                ]
            }
        });

        expect(ids).toEqual([late.id]);
        expect(ids).not.toContain(early.id);
    });

    it("filters products through OptionsFilter stock tiers", async () => {
        await using low = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Low stock",
            sku: "OPT-LOW",
            status: "active",
            stock: 2,
            tags: ["a"]
        });
        await using high = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "High stock",
            sku: "OPT-HIGH",
            status: "active",
            stock: 20,
            tags: ["a"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "stockTier", operation: FilterOperatorTypes.Equal, value: "low" }]
            }
        });

        expect(ids).toEqual([low.id]);
        expect(ids).not.toContain(high.id);
    });

    it("filters products through GroupFilter status and stock rules", async () => {
        await using match = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Group match",
            sku: "GRP-MATCH",
            status: "active",
            stock: 10,
            tags: ["a"]
        });
        await using wrongStatus = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Wrong status",
            sku: "GRP-STATUS",
            status: "pending",
            stock: 10,
            tags: ["a"]
        });
        await using lowStock = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Low stock active",
            sku: "GRP-STOCK",
            status: "active",
            stock: 2,
            tags: ["a"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "stockStatusGroup",
                        operation: FilterOperatorTypes.Equal,
                        value: [
                            { operation: FilterOperatorTypes.Equal, value: "active" },
                            { operation: FilterOperatorTypes.Greater, value: 5 }
                        ]
                    }
                ]
            }
        });

        expect(ids).toEqual([match.id]);
        expect(ids).not.toContain(wrongStatus.id);
        expect(ids).not.toContain(lowStock.id);
    });
});

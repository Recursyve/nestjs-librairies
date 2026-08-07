import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededCatalogItem } from "./seeds/create-seeded-catalog-item";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededEdition } from "./seeds/create-seeded-edition";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededProduct } from "./seeds/create-seeded-product";
import { createSeededResident } from "./seeds/create-seeded-resident";
import { createSeededResidentAddress } from "./seeds/create-seeded-resident-address";
import { createSeededSubscriber } from "./seeds/create-seeded-subscriber";

const montrealCenter = { type: "Point" as const, coordinates: [-73.5673, 45.5017] as [number, number] };

describe("default filter behavior", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("applies required defaultFilter on catalog items even when query rules are empty", async () => {
        await using published = await createSeededCatalogItem({
            code: "CAT-PUB",
            label: "Published item",
            status: "published"
        });
        await using draft = await createSeededCatalogItem({
            code: "CAT-DRAFT",
            label: "Draft item",
            status: "draft"
        });

        const ids = await harness.filterIds("catalog-items", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(ids).toContain(published.id);
        expect(ids).not.toContain(draft.id);
    });

    it("applies required defaultFilter on subscribers for email contains @", async () => {
        await using valid = await createSeededSubscriber({
            display_name: "Valid Subscriber",
            email: "valid@example.com"
        });
        await using invalid = await createSeededSubscriber({
            display_name: "Invalid Subscriber",
            email: "invalid.example.com"
        });

        const ids = await harness.filterIds("subscribers", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(ids).toContain(valid.id);
        expect(ids).not.toContain(invalid.id);
    });
});

describe("default and JSON order rules on MySQL", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("applies defaultOrderRule on editions when no explicit order is provided", async () => {
        await using second = await createSeededEdition({
            code: "ED-002",
            metadata: { imprint: "Zeta Press" },
            status: "active",
            title: "Second edition"
        });
        await using first = await createSeededEdition({
            code: "ED-001",
            metadata: { imprint: "Alpha Press" },
            status: "active",
            title: "First edition"
        });

        const response = await harness.postFilter("editions", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        const ids = TestHarness.mapFilterRowIds(body).filter((id) => [first.id, second.id].includes(id));
        expect(ids).toEqual([first.id, second.id]);
    });

    it("orders editions by JsonOrderRule ascending", async () => {
        await using zeta = await createSeededEdition({
            code: "ED-ZETA",
            metadata: { imprint: "Zeta Press" },
            status: "active",
            title: "Zeta edition"
        });
        await using acme = await createSeededEdition({
            code: "ED-ACME",
            metadata: { imprint: "Acme Press" },
            status: "active",
            title: "Acme edition"
        });

        const response = await harness.postFilter("editions", {
            page: TestHarness.defaultPage,
            order: [{ column: "imprintOrder", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const body = TestHarness.parseFilterBody<{ id: number }>(response);
        const ids = TestHarness.mapFilterRowIds(body).filter((id) => [acme.id, zeta.id].includes(id));
        expect(ids).toEqual([acme.id, zeta.id]);
    });
});

describe("direct CoordinateFilter", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    /**
     * @p0 suspected-defect
     * Observed: CoordinateFilter generates latitude/longitude column paths on GEOMETRY geo_point.
     */
    it("currently responds with 500 when filtering coords by direct CoordinateFilter equal operator", async () => {
        await using montrealLoc = await createSeededLocation({ value: "Montreal", unique_code: "MTL-COORD" });
        await using _montreal = await createSeededCoords({
            location_id: montrealLoc.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1",
            geo_point: montrealCenter
        });

        const response = await harness.postFilter("coords", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "geoPoint",
                        operation: FilterOperatorTypes.Equal,
                        value: [45.5017, -73.5673]
                    }
                ]
            }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });
});

describe("OptionsFilter complex conditions", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters products through OptionsFilter option with nested condition", async () => {
        await using match = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Active low stock",
            sku: "OPT-COND-MATCH",
            status: "active",
            stock: 8,
            tags: ["a"]
        });
        await using wrongStatus = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Pending low stock",
            sku: "OPT-COND-STATUS",
            status: "pending",
            stock: 8,
            tags: ["a"]
        });
        await using highStock = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Active high stock",
            sku: "OPT-COND-STOCK",
            status: "active",
            stock: 20,
            tags: ["a"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "stockTier", operation: FilterOperatorTypes.Equal, value: "active-low" }]
            }
        });

        expect(ids).toEqual([match.id]);
        expect(ids).not.toContain(wrongStatus.id);
        expect(ids).not.toContain(highStock.id);
    });
});

describe("GroupFilter lazy value filter", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters products through lazy GroupFilter with getValueFilter", async () => {
        await using match = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Lazy group match",
            sku: "LAZY-MATCH",
            status: "active",
            stock: 12,
            tags: ["a"]
        });
        await using wrongStatus = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Lazy wrong status",
            sku: "LAZY-STATUS",
            status: "pending",
            stock: 12,
            tags: ["a"]
        });
        await using lowStock = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Lazy low stock",
            sku: "LAZY-STOCK",
            status: "active",
            stock: 3,
            tags: ["a"]
        });

        const ids = await harness.filterIds("products", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "lazyStockGroup",
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

describe("@IgnoreInSearch metadata", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    /**
     * @p0 suspected-defect
     * Observed: global search with nested address marked @IgnoreInSearch currently fails with HTTP 500.
     */
    it("currently responds with 500 when search targets nested resident address fields ignored in search", async () => {
        await using location = await createSeededLocation({ value: "Quebec", unique_code: "QC-IGN" });
        await using address = await createSeededResidentAddress({
            location_id: location.id,
            postal_code: "G1R1P5",
            street: "50 Rue Saint-Jean"
        });
        await using _resident = await createSeededResident({
            address_id: address.id,
            email: "bob@example.com",
            full_name: "Bob Beta"
        });

        const response = await harness.postFilter("residents", {
            page: TestHarness.defaultPage,
            search: { value: "Saint-Jean" },
            query: { condition: "and", rules: [] }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });

    it("still filters residents by explicit nested postal code filter when address is ignored in search", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL-SEP" });
        await using address = await createSeededResidentAddress({
            location_id: location.id,
            postal_code: "H1A1A1",
            street: "100 Main Street"
        });
        await using alice = await createSeededResident({
            address_id: address.id,
            email: "alice@example.com",
            full_name: "Alice Alpha"
        });
        await using _other = await createSeededResident({
            email: "other@example.com",
            full_name: "Other User"
        });

        const ids = await harness.filterIds("residents", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "postalCode", operation: FilterOperatorTypes.Equal, value: "H1A1A1" }]
            }
        });

        expect(ids).toEqual([alice.id]);
    });
});

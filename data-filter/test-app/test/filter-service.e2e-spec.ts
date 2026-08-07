import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededArchiveItem, softDeleteArchiveItem } from "./seeds/create-seeded-archive-item";
import { createSeededCatalogItem } from "./seeds/create-seeded-catalog-item";
import { createSeededConfigLabItem } from "./seeds/create-seeded-config-lab-item";
import { createSeededContract } from "./seeds/create-seeded-contract";
import { createSeededContractSystem } from "./seeds/create-seeded-contract-system";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededExportLabRow } from "./seeds/create-seeded-export-lab-row";
import { createSeededFilterLabRow } from "./seeds/create-seeded-filter-lab-row";
import { createSeededGroupLabEntry } from "./seeds/create-seeded-group-lab-entry";
import { createSeededInvoice } from "./seeds/create-seeded-invoice";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededMarketListing } from "./seeds/create-seeded-market-listing";
import { createSeededOrderLabRow } from "./seeds/create-seeded-order-lab-row";
import { createSeededOwner } from "./seeds/create-seeded-owner";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededPlace } from "./seeds/create-seeded-place";
import { createSeededPlaceOwner } from "./seeds/create-seeded-place-owner";
import { createSeededProduct } from "./seeds/create-seeded-product";
import { createSeededSystem } from "./seeds/create-seeded-system";
import { createSeededTenantScope } from "./seeds/create-seeded-tenant-scope";
import { createSeededTicketType } from "./seeds/create-seeded-ticket-type";

describe("getConfig translation and visibility", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("uses the default fr language for filter names when no user is deserialized", async () => {
        const response = await harness.getFilterConfig("persons");
        const firstName = TestHarness.parseFilterConfig(response).find((item) => item.id === "firstName");

        expect(response.status).toBe(200);
        expect(firstName?.name).toBe("filter.firstName.name@fr");
    });

    it("uses the default fr language when the deserialized user has no language field", async () => {
        const response = await harness.getFilterConfig("persons", { id: "no-language-user" });
        const firstName = TestHarness.parseFilterConfig(response).find((item) => item.id === "firstName");

        expect(response.status).toBe(200);
        expect(firstName?.name).toBe("filter.firstName.name@fr");
    });

    it("uses the deserialized user language for filter config names", async () => {
        const response = await harness.getFilterConfig("persons", { id: "en-user", language: "en" });
        const firstName = TestHarness.parseFilterConfig(response).find((item) => item.id === "firstName");

        expect(response.status).toBe(200);
        expect(firstName?.name).toBe("filter.firstName.name@en");
    });

    it("omits filters whose getConfig returns null", async () => {
        const response = await harness.getFilterConfig("config-lab-items");
        const ids = TestHarness.parseFilterConfig(response).map((item) => item.id);

        expect(response.status).toBe(200);
        expect(ids).toEqual(["label"]);
        expect(ids).not.toContain("hiddenSecret");
    });
});

describe("forData attribute switching", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns summary attributes when forData switches the data definition", async () => {
        await using alpha = await createSeededFilterLabRow({ code: "ALPHA", detail_note: "alpha detail" });
        await using beta = await createSeededFilterLabRow({ code: "BETA", detail_note: "beta detail" });

        const detailResponse = await harness.postFilter("filter-lab", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        const summaryResponse = await harness.getForDataSummary("filter-lab");

        expect(detailResponse.status).toBe(200);
        const detailRows = TestHarness.parseFilterBody<{ code: string; detail_note?: string }>(detailResponse).values;
        expect(detailRows.map((row) => row.code).sort()).toEqual([alpha.code, beta.code].sort());
        expect(detailRows.every((row) => row.detail_note !== undefined)).toBe(true);

        expect(summaryResponse.status).toBe(200);
        expect(summaryResponse.body).toEqual({
            codes: [alpha.code, beta.code].sort(),
            hasDetailNote: false
        });
    });
});

describe("default filter query wrapping", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("wraps required default filters in AND when the incoming query uses OR", async () => {
        await using published = await createSeededCatalogItem({
            code: "REQ-OR-PUB",
            label: "Published OR",
            status: "published"
        });
        await using draft = await createSeededCatalogItem({
            code: "REQ-OR-DRAFT",
            label: "Draft OR",
            status: "draft"
        });

        const ids = await harness.filterIds("catalog-items", {
            page: TestHarness.defaultPage,
            query: {
                condition: "or",
                rules: [
                    { id: "status", operation: FilterOperatorTypes.Equal, value: "draft" },
                    { id: "status", operation: FilterOperatorTypes.Equal, value: "published" }
                ]
            }
        });

        expect(ids).toEqual([published.id]);
        expect(ids).not.toContain(draft.id);
    });

    it("wraps optional default filters in OR when the incoming query uses AND", async () => {
        await using pub = await createSeededMarketListing({ title: "Wrap public", visibility: "public" });
        await using priv = await createSeededMarketListing({ title: "Wrap private", visibility: "private" });

        const ids = await harness.filterIds("market-listings", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "visibility", operation: FilterOperatorTypes.Equal, value: "private" }]
            }
        });

        expect(ids.sort()).toEqual([pub.id, priv.id].sort());
    });
});

describe("search, count, and download language", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("searches with the deserialized user language on filter requests", async () => {
        await using french = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Lang FR",
            sku: "LANG-FR",
            status: "active",
            stock: 1,
            tags: ["a"],
            translations: { fr: "Bonjour", en: "Hello" }
        });
        await using english = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Lang EN",
            sku: "LANG-EN",
            status: "active",
            stock: 1,
            tags: ["a"],
            translations: { fr: "Salut", en: "Greetings" }
        });

        const frIds = await harness.filterIds(
            "products",
            {
                page: TestHarness.defaultPage,
                search: { value: "Bonjour" },
                query: { condition: "and", rules: [] }
            },
            { id: "fr-user", language: "fr" }
        );
        const enIds = await harness.filterIds(
            "products",
            {
                page: TestHarness.defaultPage,
                search: { value: "Greetings" },
                query: { condition: "and", rules: [] }
            },
            { id: "en-user", language: "en" }
        );

        expect(frIds).toEqual([french.id]);
        expect(enIds).toEqual([english.id]);
    });

    it("downloads persons through the export-field mapping path with stable export headers", async () => {
        await using _person = await createSeededPerson({
            email: "download-lang@example.com",
            first_name: "Download",
            last_name: "Lang"
        });

        const downloadResponse = await harness.postDownload(
            "persons",
            "csv",
            {
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            },
            { id: "en-user", language: "en" }
        );

        expect(downloadResponse.status).toBe(200);
        expect(TestHarness.parseCsv(downloadResponse.text)).toEqual([
            ["exports.email", "exports.first_name", "exports.last_name"],
            ["download-lang@example.com", "Download", "Lang"]
        ]);
    });

    it("downloads with order and search on export-mapped resources", async () => {
        await using _match = await createSeededPerson({
            email: "signup.user@example.com",
            first_name: "Signup",
            last_name: "User"
        });
        await using _other = await createSeededPerson({
            email: "purchase.user@example.com",
            first_name: "Purchase",
            last_name: "User"
        });

        const downloadResponse = await harness.postDownload(
            "persons",
            "csv",
            {
                page: TestHarness.defaultPage,
                order: [{ column: "id", direction: "desc" }],
                search: { value: "signup" },
                query: { condition: "and", rules: [] }
            },
            { id: "fr-user", language: "fr" }
        );

        expect(downloadResponse.status).toBe(200);
        expect(TestHarness.parseCsv(downloadResponse.text)).toEqual([
            ["exports.email", "exports.first_name", "exports.last_name"],
            ["signup.user@example.com", "Signup", "User"]
        ]);
    });
});

describe("select config pagination", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns an empty array for unknown select filter ids", async () => {
        const response = await harness.getFilterConfigValue("member-tiers", {
            id: "missing-select",
            value: "gold"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("returns null resource lookups for unknown select filter ids", async () => {
        const response = await harness.getFilterConfigId("member-tiers", {
            id: "missing-select",
            resourceId: "gold"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    it("resolves select resources by id when getResourceById is configured", async () => {
        const response = await harness.getFilterConfigId("member-tiers", {
            id: "tierSelect",
            resourceId: "gold"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ id: "gold", name: "Gold" });
    });

    it("treats zero pageSize as null and falls back to the select default page size", async () => {
        const zeroPageSize = await harness.getFilterConfigValue("member-tiers", {
            id: "tierSelect",
            value: "",
            page: "0",
            pageSize: "0"
        });
        const validPageSize = await harness.getFilterConfigValue("member-tiers", {
            id: "tierSelect",
            value: "",
            page: "0",
            pageSize: "2"
        });

        expect(zeroPageSize.status).toBe(200);
        expect(validPageSize.status).toBe(200);
        expect(zeroPageSize.body).toEqual([
            { id: "bronze", name: "Bronze" },
            { id: "silver", name: "Silver" }
        ]);
        expect(validPageSize.body).toEqual(zeroPageSize.body);
    });

    it("treats a zero page string as the first page", async () => {
        const zeroPage = await harness.getFilterConfigValue("member-tiers", {
            id: "tierSelect",
            value: "",
            page: "0",
            pageSize: "2"
        });
        const missingPage = await harness.getFilterConfigValue("member-tiers", {
            id: "tierSelect",
            value: "",
            pageSize: "2"
        });

        expect(zeroPage.status).toBe(200);
        expect(missingPage.status).toBe(200);
        expect(zeroPage.body).toEqual(missingPage.body);
    });
});

describe("normalizeOrder fallbacks", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("defaults to id ascending when order is an empty array", async () => {
        await using first = await createSeededTicketType({ code: "A", label: "First" });
        await using second = await createSeededTicketType({ code: "B", label: "Second" });

        const response = await harness.postFilter("ticket-types", {
            page: TestHarness.defaultPage,
            order: [],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response))).toEqual([
            first.id,
            second.id
        ]);
    });

    it("defaults to id ascending when order columns are blank strings", async () => {
        await using first = await createSeededTicketType({ code: "C", label: "Third" });
        await using second = await createSeededTicketType({ code: "D", label: "Fourth" });

        const response = await harness.postFilter("ticket-types", {
            page: TestHarness.defaultPage,
            order: [{ column: "", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response))).toEqual([
            first.id,
            second.id
        ]);
    });
});

describe("group filter includes on products", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("requires both group root and value filters for non-lazy stockStatusGroup", async () => {
        await using match = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Include match",
            sku: "INC-MATCH",
            status: "active",
            stock: 10,
            tags: ["a"]
        });
        await using activeLowStock = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Include low stock",
            sku: "INC-LOW",
            status: "active",
            stock: 2,
            tags: ["a"]
        });
        await using pendingHighStock = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Include pending",
            sku: "INC-PEND",
            status: "pending",
            stock: 10,
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
        expect(ids).not.toContain(activeLowStock.id);
        expect(ids).not.toContain(pendingHighStock.id);
    });

    it("requires lazy getValueFilter resolution for lazyStockGroup array values", async () => {
        await using match = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Lazy include match",
            sku: "LAZY-INC-MATCH",
            status: "active",
            stock: 12,
            tags: ["a"]
        });
        await using wrongStatus = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Lazy include status",
            sku: "LAZY-INC-STATUS",
            status: "pending",
            stock: 12,
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
    });
});

describe("nested query groups", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns rows for nested OR groups with empty child rule lists", async () => {
        await using fiction = await createSeededConfigLabItem({ label: "Nested fiction", secret_code: "S1" });
        await using essay = await createSeededConfigLabItem({ label: "Nested essay", secret_code: "S2" });

        const ids = await harness.filterIds("config-lab-items", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        condition: "or",
                        rules: []
                    },
                    { id: "label", operation: FilterOperatorTypes.Equal, value: "Nested fiction" }
                ]
            }
        });

        expect(ids).toEqual([fiction.id]);
        expect(ids).not.toContain(essay.id);
    });
});

describe("localized export download", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("downloads localized export rows in fr", async () => {
        await using _row = await createSeededExportLabRow({
            code: "EXP-FR",
            label_fr: "Libellé FR",
            label_en: "Label EN"
        });

        const response = await harness.postDownload(
            "export-lab",
            "csv",
            {
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            },
            { id: "fr-user", language: "fr" }
        );

        expect(response.status).toBe(200);
        expect(TestHarness.parseCsv(response.text)[1]).toEqual(["Libellé FR", "csv"]);
    });

    it("downloads localized export rows in en", async () => {
        await using _row = await createSeededExportLabRow({
            code: "EXP-EN",
            label_fr: "Libellé FR",
            label_en: "Label EN"
        });

        const response = await harness.postDownload(
            "export-lab",
            "csv",
            {
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            },
            { id: "en-user", language: "en" }
        );

        expect(response.status).toBe(200);
        expect(TestHarness.parseCsv(response.text)[1]).toEqual(["Label EN", "csv"]);
    });

    it.each([
        ["csv", (body: string | Buffer) => TestHarness.parseCsv(String(body))],
        ["xlsx", (body: string | Buffer) => TestHarness.parseXlsx(body as Buffer)]
    ] as const)(
        "forwards ExportTypes.%s into getExportedFieldsKeys and getExportedFields",
        async (type, parse) => {
            await using _row = await createSeededExportLabRow({
                code: `EXP-${type.toUpperCase()}`,
                label_fr: "Libellé FR",
                label_en: "Label EN"
            });

            const response =
                type === "csv"
                    ? await harness.postDownload(
                          "export-lab",
                          type,
                          {
                              page: TestHarness.defaultPage,
                              query: { condition: "and", rules: [] }
                          },
                          { id: `${type}-user`, language: "fr" }
                      )
                    : await harness.postDownloadBinary(
                          "export-lab",
                          type,
                          {
                              page: TestHarness.defaultPage,
                              query: { condition: "and", rules: [] }
                          },
                          { id: `${type}-user`, language: "fr" }
                      );

            expect(response.status).toBe(200);
            const rows = parse(type === "csv" ? response.text : (response.body as Buffer));
            expect(rows[0]).toEqual([`exports.localized_label`, `exports.download_type_${type}`]);
            expect(rows[1]).toEqual(["Libellé FR", type]);
        }
    );
});

describe("paranoid false filters", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("includes soft-deleted rows when filtering through a paranoid false text filter", async () => {
        await using deleted = await createSeededArchiveItem({ title: "Deleted memo", status: "archived" });
        await using active = await createSeededArchiveItem({ title: "Active memo", status: "active" });
        await softDeleteArchiveItem(deleted.id);

        const ids = await harness.filterIds("archive-items", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "title", operation: FilterOperatorTypes.Contains, value: "memo" }]
            }
        });

        expect(ids.sort()).toEqual([active.id, deleted.id].sort());
    });
});

describe("tenant scopes where and conditions", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters tenant scopes through a where callback bound to the request tenant id", async () => {
        await using tenantA = await createSeededTenantScope({ tenant_id: 11, label: "Tenant A scope" });
        await using _tenantB = await createSeededTenantScope({ tenant_id: 22, label: "Tenant B scope" });

        const ids = await harness.filterIds(
            "tenant-scopes",
            {
                page: TestHarness.defaultPage,
                query: {
                    condition: "and",
                    rules: [{ id: "tenantLabel", operation: FilterOperatorTypes.Equal, value: "Tenant A scope" }]
                }
            },
            undefined,
            { tenantId: 11 }
        );

        expect(ids).toEqual([tenantA.id]);
    });

    it("filters tenant scopes through an implicit category condition on the label filter", async () => {
        await using match = await createSeededTenantScope({ tenant_id: 7, label: "Scoped label" });
        await using wrongTenant = await createSeededTenantScope({ tenant_id: 8, label: "Scoped label" });

        const ids = await harness.filterIds("tenant-scopes", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "categoryScoped", operation: FilterOperatorTypes.Equal, value: "Scoped label" }]
            }
        });

        expect(ids).toEqual([match.id]);
        expect(ids).not.toContain(wrongTenant.id);
    });
});

describe("eager and lazy group filter includes", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters through eager group status and score rules", async () => {
        await using match = await createSeededGroupLabEntry({ status: "open", tier: "gold", score: 90 });
        await using lowScore = await createSeededGroupLabEntry({ status: "open", tier: "gold", score: 10 });
        await using closed = await createSeededGroupLabEntry({ status: "closed", tier: "gold", score: 90 });

        const ids = await harness.filterIds("group-lab", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "eagerStatusScoreGroup",
                        operation: FilterOperatorTypes.Equal,
                        value: [
                            { operation: FilterOperatorTypes.Equal, value: "open" },
                            { operation: FilterOperatorTypes.Greater, value: 50 }
                        ]
                    }
                ]
            }
        });

        expect(ids).toEqual([match.id]);
        expect(ids).not.toContain(lowScore.id);
        expect(ids).not.toContain(closed.id);
    });

    it("filters through lazy group tier and score rules", async () => {
        await using match = await createSeededGroupLabEntry({ status: "open", tier: "gold", score: 80 });
        await using wrongTier = await createSeededGroupLabEntry({ status: "open", tier: "silver", score: 80 });
        await using lowScore = await createSeededGroupLabEntry({ status: "open", tier: "gold", score: 5 });

        const ids = await harness.filterIds("group-lab", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "lazyTierScoreGroup",
                        operation: FilterOperatorTypes.Equal,
                        value: [
                            { operation: FilterOperatorTypes.Equal, value: "gold" },
                            { operation: FilterOperatorTypes.Greater, value: 20 }
                        ]
                    }
                ]
            }
        });

        expect(ids).toEqual([match.id]);
        expect(ids).not.toContain(wrongTier.id);
        expect(ids).not.toContain(lowScore.id);
    });
});

describe("default order rule deduplication", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("deduplicates the default id order when explicit id desc is requested", async () => {
        await using first = await createSeededOrderLabRow({ code: "A", label: "First" });
        await using second = await createSeededOrderLabRow({ code: "B", label: "Second" });

        const response = await harness.postFilter("order-lab", {
            page: TestHarness.defaultPage,
            order: [{ column: "id", direction: "desc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response))).toEqual([
            second.id,
            first.id
        ]);
    });
});

describe("contract systems conditions and having", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters contract-systems through owner first name with implicit last-name condition includes", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL-CS" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 1,
            address: "1 Test",
            postal_code: "H1A1A1"
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using alice = await createSeededPerson({
            email: "alice.cs@example.com",
            first_name: "Alice",
            last_name: "Alpha"
        });
        await using owner = await createSeededOwner({ person_id: alice.id });
        await using _placeOwner = await createSeededPlaceOwner({ place_id: place.id, owner_id: owner.id });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-CS",
            latitude: 45.5,
            longitude: -73.5
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-CS",
            paid: true,
            subtotal: 1,
            total_cost: 1
        });
        await using contract = await createSeededContract({
            invoice_id: invoice.id,
            start_date: "2024-01-01",
            end_date: "2025-12-31",
            payable_by: "2024-06-01",
            total_cost: 1000
        });
        await using csAlice = await createSeededContractSystem({
            contract_id: contract.id,
            system_id: system.id,
            active: true,
            activated_date: "2024-02-01"
        });

        await using locationB = await createSeededLocation({ value: "Quebec", unique_code: "QC-CS" });
        await using coordB = await createSeededCoords({
            location_id: locationB.id,
            street_number: 2,
            address: "2 Test",
            postal_code: "G1R1R1"
        });
        await using placeB = await createSeededPlace({ billing_coord_id: coordB.id, geo_coord_id: coordB.id });
        await using aliceBeta = await createSeededPerson({
            email: "alice.beta.cs@example.com",
            first_name: "Alice",
            last_name: "Beta"
        });
        await using ownerB = await createSeededOwner({ person_id: aliceBeta.id });
        await using _placeOwnerB = await createSeededPlaceOwner({ place_id: placeB.id, owner_id: ownerB.id });
        await using systemB = await createSeededSystem({
            place_id: placeB.id,
            file_number: "SYS-CS-B",
            latitude: 46.8,
            longitude: -71.2
        });
        await using invoiceB = await createSeededInvoice({
            invoice_number: "INV-CS-B",
            paid: true,
            subtotal: 1,
            total_cost: 1
        });
        await using contractB = await createSeededContract({
            invoice_id: invoiceB.id,
            start_date: "2024-01-01",
            end_date: "2025-12-31",
            payable_by: "2024-06-01",
            total_cost: 1000
        });
        await using _csAliceBeta = await createSeededContractSystem({
            contract_id: contractB.id,
            system_id: systemB.id,
            active: true,
            activated_date: "2024-02-01"
        });

        const ids = await harness.filterIds("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "ownerFirstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(ids).toEqual([csAlice.id]);
    });

    it("returns HTTP 500 for visit count filters through HAVING", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL-HV" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 1,
            address: "1 Test",
            postal_code: "H1A1A1"
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-HV",
            latitude: 45.5,
            longitude: -73.5
        });
        await using invoice = await createSeededInvoice({
            invoice_number: "INV-HV",
            paid: true,
            subtotal: 1,
            total_cost: 1
        });
        await using contract = await createSeededContract({
            invoice_id: invoice.id,
            start_date: "2024-01-01",
            end_date: "2025-12-31",
            payable_by: "2024-06-01",
            total_cost: 1000
        });
        await using _cs = await createSeededContractSystem({
            contract_id: contract.id,
            system_id: system.id,
            active: true,
            activated_date: "2024-02-01"
        });

        const filterResponse = await harness.postFilter("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "visitCount", operation: FilterOperatorTypes.GreaterOrEqual, value: 1 }]
            }
        });
        const countResponse = await harness.postFilterCount("contract-systems", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "visitCount", operation: FilterOperatorTypes.GreaterOrEqual, value: 1 }]
            }
        });

        TestHarness.expectInternalServerErrorFilterResponse(filterResponse);
        expect(countResponse.status).toBe(500);
    });
});

describe("search count language", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("counts translated search matches for the deserialized user language", async () => {
        await using _french = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Count FR",
            sku: "CNT-FR",
            status: "active",
            stock: 1,
            tags: ["a"],
            translations: { fr: "Bonjour", en: "Hello" }
        });
        await using _english = await createSeededProduct({
            metadata: { brand: "Acme" },
            name: "Count EN",
            sku: "CNT-EN",
            status: "active",
            stock: 1,
            tags: ["a"],
            translations: { fr: "Salut", en: "Greetings" }
        });

        const frCount = await harness.postFilterCount(
            "products",
            {
                page: TestHarness.defaultPage,
                search: { value: "Bonjour" },
                query: { condition: "and", rules: [] }
            },
            { id: "fr-user", language: "fr" }
        );
        const enCount = await harness.postFilterCount(
            "products",
            {
                page: TestHarness.defaultPage,
                search: { value: "Bonjour" },
                query: { condition: "and", rules: [] }
            },
            { id: "en-user", language: "en" }
        );

        expect(frCount.status).toBe(200);
        expect(enCount.status).toBe(200);
        expect(harness.parseCountBody(frCount)).toBe(1);
        expect(harness.parseCountBody(enCount)).toBe(0);
    });
});

describe("getConfig without user", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("uses fr fallback when getConfig is called with an undefined user", async () => {
        const response = await request(harness.app.getHttpServer()).get("/filter-lab/config-without-user");

        expect(response.status).toBe(200);
        const code = TestHarness.parseFilterConfig(response).find((item) => item.id === "code");
        expect(code?.name).toBe("filter.code.name@fr");
    });
});

describe("required default filter with empty query", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("applies required default filter when the incoming query is undefined-shaped as empty AND", async () => {
        await using published = await createSeededCatalogItem({
            code: "REQ-EMPTY-PUB",
            label: "Published empty",
            status: "published"
        });
        await using draft = await createSeededCatalogItem({
            code: "REQ-EMPTY-DRAFT",
            label: "Draft empty",
            status: "draft"
        });

        const ids = await harness.filterIds("catalog-items", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([published.id]);
        expect(ids).not.toContain(draft.id);
    });
});

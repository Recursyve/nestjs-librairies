import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededCatalogItem } from "./seeds/create-seeded-catalog-item";
import { createSeededConfigLabItem } from "./seeds/create-seeded-config-lab-item";
import { createSeededFilterLabRow } from "./seeds/create-seeded-filter-lab-row";
import { createSeededMarketListing } from "./seeds/create-seeded-market-listing";
import { createSeededPerson } from "./seeds/create-seeded-person";
import { createSeededProduct } from "./seeds/create-seeded-product";
import { createSeededTicketType } from "./seeds/create-seeded-ticket-type";

describe("filter service getConfig translation and visibility", () => {
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

describe("filter service forData", () => {
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

describe("filter service default filter wrapping", () => {
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

describe("filter service search and download language branches", () => {
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

    it("downloads through the order and search branches on export-mapped resources", async () => {
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

describe("filter service select config pagination edge cases", () => {
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

describe("filter service normalizeOrder defaults", () => {
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

describe("filter service group filter include branches", () => {
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

describe("filter service nested query branches", () => {
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

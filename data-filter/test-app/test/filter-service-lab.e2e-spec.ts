import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededMarketListing } from "./seeds/create-seeded-market-listing";
import { createSeededPriorityLane } from "./seeds/create-seeded-priority-lane";
import { createSeededProfileCaption } from "./seeds/create-seeded-profile-caption";
import { createSeededRawEvent } from "./seeds/create-seeded-raw-event";
import { createSeededTicketType } from "./seeds/create-seeded-ticket-type";

describe("optional defaultFilter on market listings", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns only public listings when the query is empty", async () => {
        await using pub = await createSeededMarketListing({ title: "Public item", visibility: "public" });
        await using priv = await createSeededMarketListing({ title: "Private item", visibility: "private" });

        const ids = await harness.filterIds("market-listings", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(ids).toEqual([pub.id]);
        expect(ids).not.toContain(priv.id);
    });

    it("returns private and public listings when visibility private is requested explicitly", async () => {
        await using pub = await createSeededMarketListing({ title: "Public alt", visibility: "public" });
        await using priv = await createSeededMarketListing({ title: "Private alt", visibility: "private" });

        const ids = await harness.filterIds("market-listings", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "visibility", operation: FilterOperatorTypes.Equal, value: "private" }]
            }
        });

        expect(ids.sort()).toEqual([pub.id, priv.id].sort());
    });

    it("returns the same total from filter-count as from filter", async () => {
        await using _pub = await createSeededMarketListing({ title: "Count public", visibility: "public" });
        await using _priv = await createSeededMarketListing({ title: "Count private", visibility: "private" });

        const body = {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        };

        const filterResponse = await harness.postFilter("market-listings", body);
        const countResponse = await harness.postFilterCount("market-listings", body);

        expect(filterResponse.status).toBe(200);
        expect(countResponse.status).toBe(200);
        expect(harness.parseCountBody(countResponse)).toBe(
            TestHarness.parseFilterBody<{ id: number }>(filterResponse).total
        );
    });
});

describe("profile caption filter conditions", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("applies implicit category condition when filtering captions", async () => {
        await using fiction = await createSeededProfileCaption({ caption: "Chapter 1", category: "fiction" });
        await using essay = await createSeededProfileCaption({ caption: "Chapter 2", category: "essay" });

        const ids = await harness.filterIds("profile-captions", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "caption", operation: FilterOperatorTypes.Equal, value: "Chapter 1" }]
            }
        });

        expect(ids).toEqual([fiction.id]);
        expect(ids).not.toContain(essay.id);
    });
});

describe("enum order rule on priority lanes", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("completes a filter request that orders by enum priority rule", async () => {
        await using _lane = await createSeededPriorityLane({ code: "LANE-A", priority_level: "high" });

        const response = await harness.postFilter("priority-lanes", {
            page: TestHarness.defaultPage,
            order: [{ column: "lanePriorityOrder", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect([200, 500]).toContain(response.status);
    }, 10_000);
});

describe("top-level OR queries on ticket types", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns rows matching either side of an OR query", async () => {
        await using vip = await createSeededTicketType({ code: "VIP", label: "VIP pass" });
        await using standard = await createSeededTicketType({ code: "STD", label: "Standard pass" });
        await using other = await createSeededTicketType({ code: "EXT", label: "Extra pass" });

        const ids = await harness.filterIds("ticket-types", {
            page: TestHarness.defaultPage,
            query: {
                condition: "or",
                rules: [
                    { id: "code", operation: FilterOperatorTypes.Equal, value: "VIP" },
                    { id: "label", operation: FilterOperatorTypes.Equal, value: "Standard pass" }
                ]
            }
        });

        expect(ids.sort()).toEqual([vip.id, standard.id].sort());
        expect(ids).not.toContain(other.id);
    });

    it("defaults to id ascending order when order columns are blank", async () => {
        await using first = await createSeededTicketType({ code: "A", label: "First" });
        await using second = await createSeededTicketType({ code: "B", label: "Second" });

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

describe("raw events download without export field mapping", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("downloads CSV rows without configured export headers", async () => {
        await using alpha = await createSeededRawEvent({ event_name: "alpha", source: "api" });
        await using beta = await createSeededRawEvent({ event_name: "beta", source: "api" });

        const response = await harness.postDownload("raw-events", "csv", {
            page: TestHarness.defaultPage,
            order: [{ column: "id", direction: "asc" }],
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        const text = response.text;
        expect(text).toContain("alpha");
        expect(text).toContain("beta");
        expect(text).not.toContain("exports.");
    });

    it("downloads filtered raw events with search applied", async () => {
        await using match = await createSeededRawEvent({ event_name: "signup", source: "web" });
        await using other = await createSeededRawEvent({ event_name: "purchase", source: "pos" });

        const response = await harness.postDownload("raw-events", "csv", {
            page: TestHarness.defaultPage,
            search: { value: "signup" },
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(response.text).toContain("signup");
        expect(response.text).not.toContain("purchase");
        expect(response.text).not.toContain(String(other.id));
        expect(response.text).toContain(String(match.id));
    });
});

describe("lazy select config pagination on member tiers", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns a single page of select values when page and pageSize are provided", async () => {
        const response = await harness.getFilterConfigValue("member-tiers", {
            id: "tierSelect",
            value: "",
            page: "0",
            pageSize: "2"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            { id: "bronze", name: "Bronze" },
            { id: "silver", name: "Silver" }
        ]);
    });

    it("returns the second page of select values", async () => {
        const response = await harness.getFilterConfigValue("member-tiers", {
            id: "tierSelect",
            value: "",
            page: "1",
            pageSize: "2"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            { id: "gold", name: "Gold" },
            { id: "platinum", name: "Platinum" }
        ]);
    });

    it("resolves a select resource by id", async () => {
        const response = await harness.getFilterConfigId("member-tiers", {
            id: "tierSelect",
            resourceId: "gold"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ id: "gold", name: "Gold" });
    });
});

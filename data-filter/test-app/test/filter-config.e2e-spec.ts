import { FilterType } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";

describe("filter configuration endpoint", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns operator metadata for text filters on persons", async () => {
        const response = await harness.getFilterConfig("persons");
        const firstName = TestHarness.parseFilterConfig(response).find((item) => item.id === "firstName");

        expect(firstName?.type).toBe(FilterType.Text);
        expect(firstName?.operators.map((op) => op.id)).toEqual(
            expect.arrayContaining(["equal", "contains", "begins_with", "ends_with"])
        );
    });

    it("returns JSON filter configuration on products", async () => {
        const response = await harness.getFilterConfig("products");
        const category = TestHarness.parseFilterConfig(response).find((item) => item.id === "category");

        expect(category?.type).toBe(FilterType.Text);
        expect(category?.operators.map((op) => op.id)).toEqual(expect.arrayContaining(["equal", "contains"]));
    });

    it("returns select filter values for contract-system visit type", async () => {
        const response = await harness.getFilterConfig("contract-systems");
        const statusSelect = TestHarness.parseFilterConfig(response).find((item) => item.id === "statusSelect");

        expect(statusSelect?.type).toBe(FilterType.Select);
        expect(statusSelect?.lazyLoading).toBe(false);
        expect(statusSelect?.values).toEqual([
            { id: "inspection", name: "Inspection" },
            { id: "repair", name: "Repair" }
        ]);
    });

    it("returns select values from searchFilterConfigValues without server-side filtering", async () => {
        const response = await harness.getFilterConfigValue("contract-systems", {
            id: "statusSelect",
            value: "ins"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            { id: "inspection", name: "Inspection" },
            { id: "repair", name: "Repair" }
        ]);
    });

    it("returns date, radio, and geo filter metadata from public config endpoints", async () => {
        const contractSystems = await harness.getFilterConfig("contract-systems");
        const coords = await harness.getFilterConfig("coords");
        const systems = await harness.getFilterConfig("systems");

        const contractStart = TestHarness.parseFilterConfig(contractSystems).find(
            (item) => item.id === "contractStart"
        );
        const active = TestHarness.parseFilterConfig(contractSystems).find((item) => item.id === "active");
        const distance = TestHarness.parseFilterConfig(coords).find((item) => item.id === "distance");
        const geoBounds = TestHarness.parseFilterConfig(systems).find((item) => item.id === "geoBounds");

        expect(contractStart?.type).toBe(FilterType.Date);
        expect(active?.type).toBe(FilterType.Radio);
        expect(distance?.type).toBe(FilterType.GeoLocalization);
        expect(geoBounds?.type).toBe(FilterType.GeoBounds);
    });

    it("returns DateOnly, DateTime, Options, and Group filter metadata on public config endpoints", async () => {
        const contracts = await harness.getFilterConfig("contracts");
        const products = await harness.getFilterConfig("products");

        const startDate = TestHarness.parseFilterConfig(contracts).find((item) => item.id === "startDate");
        const listedAt = TestHarness.parseFilterConfig(products).find((item) => item.id === "listedAt");
        const stockTier = TestHarness.parseFilterConfig(products).find((item) => item.id === "stockTier");
        const stockStatusGroup = TestHarness.parseFilterConfig(products).find((item) => item.id === "stockStatusGroup");

        expect(startDate?.type).toBe(FilterType.Date);
        expect(listedAt?.type).toBe(FilterType.DateTime);
        expect(stockTier?.type).toBe(FilterType.Options);
        expect(stockStatusGroup?.type).toBe(FilterType.Group);
    });

    it("returns a select resource by id from filter/config/id", async () => {
        const response = await harness.getFilterConfigId("contract-systems", {
            id: "statusSelect",
            resourceId: "repair"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ id: "repair", name: "Repair" });
    });

    it("returns empty select values for unknown filter ids", async () => {
        const response = await harness.getFilterConfigValue("contract-systems", {
            id: "unknown-filter",
            value: "anything"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("returns an empty object for unknown filter ids from filter/config/id", async () => {
        const response = await harness.getFilterConfigId("contract-systems", {
            id: "unknown-filter",
            resourceId: "repair"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });

    it("returns an empty array when searching config values on a non-select filter", async () => {
        const response = await harness.getFilterConfigValue("contract-systems", {
            id: "active",
            value: "yes"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it("returns null when requesting a select resource on a non-select filter", async () => {
        const response = await harness.getFilterConfigId("contract-systems", {
            id: "active",
            resourceId: "yes"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
    });
});

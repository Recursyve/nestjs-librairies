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
        const firstName = response.body.find((item: { id: string }) => item.id === "firstName");

        expect(firstName.type).toBe(FilterType.Text);
        expect(firstName.operators.map((op: { id: string }) => op.id)).toEqual(
            expect.arrayContaining(["equal", "contains", "begins_with", "ends_with"])
        );
    });

    it("returns JSON filter configuration on products", async () => {
        const response = await harness.getFilterConfig("products");
        const category = response.body.find((item: { id: string }) => item.id === "category");

        expect(category.type).toBe(FilterType.Text);
        expect(category.operators.map((op: { id: string }) => op.id)).toEqual(
            expect.arrayContaining(["equal", "contains"])
        );
    });

    it("returns select filter values for contract-system visit type", async () => {
        const response = await harness.getFilterConfig("contract-systems");
        const statusSelect = response.body.find((item: { id: string }) => item.id === "statusSelect");

        expect(statusSelect.type).toBe(FilterType.Select);
        expect(statusSelect.lazyLoading).toBe(false);
        expect(statusSelect.values).toEqual([
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

        const contractStart = contractSystems.body.find((item: { id: string }) => item.id === "contractStart");
        const active = contractSystems.body.find((item: { id: string }) => item.id === "active");
        const distance = coords.body.find((item: { id: string }) => item.id === "distance");
        const geoBounds = systems.body.find((item: { id: string }) => item.id === "geoBounds");

        expect(contractStart.type).toBe(FilterType.Date);
        expect(active.type).toBe(FilterType.Radio);
        expect(distance.type).toBe(FilterType.GeoLocalization);
        expect(geoBounds.type).toBe(FilterType.GeoBounds);
    });

    it("returns a select resource by id from filter/config/id", async () => {
        const response = await harness.getFilterConfigId("contract-systems", {
            id: "statusSelect",
            resourceId: "repair"
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ id: "repair", name: "Repair" });
    });
});

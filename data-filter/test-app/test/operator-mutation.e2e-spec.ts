import { FilterOperatorTypes, optionsFilterSelectionModes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DefaultAdaptersHarness } from "./harness/default-adapters-harness";
import { TestHarness } from "./harness/test-harness";
import request from "supertest";

describe("Filter.addOperators / removeOperators / setOperators", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("exposes the mutated operator lists through getConfig", async () => {
        const response = await harness.getFilterConfig("spell-scrolls");
        expect(response.status).toBe(200);
        const config = TestHarness.parseFilterConfig(response);

        const title = config.find((entry) => entry.id === "title");
        const manaCost = config.find((entry) => entry.id === "manaCost");

        const titleOps = (title?.operators ?? []).map((op) => op.id);
        expect(titleOps).toContain("exact_title");
        expect(titleOps).not.toContain(FilterOperatorTypes.EndsWith);
        expect(titleOps).not.toContain(FilterOperatorTypes.NotEndsWith);
        expect(titleOps).toContain(FilterOperatorTypes.Contains);

        expect((manaCost?.operators ?? []).map((op) => op.id).sort()).toEqual(
            [FilterOperatorTypes.Equal, FilterOperatorTypes.Greater].sort()
        );
    });
});

describe("optionsFilterSelectionModes export", () => {
    it("exposes radio and select modes", () => {
        expect(optionsFilterSelectionModes).toEqual(["radio", "select"]);
    });
});

describe("DefaultTranslateAdapter", () => {
    let harness: DefaultAdaptersHarness;

    beforeAll(async () => {
        harness = await DefaultAdaptersHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns translation keys unchanged through getConfig", async () => {
        const response = await request(harness.app.getHttpServer()).get("/locations/filter/config");
        expect(response.status).toBe(200);
        const value = TestHarness.parseFilterConfig(response).find((entry) => entry.id === "value");
        expect(value?.name).toBe("filter.value.name");
        expect(value?.operators?.[0]?.name).toMatch(/^data_filter\.filter\.operators\./);
    });
});

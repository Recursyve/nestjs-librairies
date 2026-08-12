import { FilterOperatorTypes, optionsFilterSelectionModes } from "@recursyve/nestjs-data-filter";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DefaultAdaptersHarness } from "./harness/default-adapters-harness";
import { TestHarness } from "./harness/test-harness";
import { createSeededSpellScroll } from "./seeds/create-seeded-spell-scroll";

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

    it("executes a custom addOperators alias as its underlying FilterOperatorTypes", async () => {
        await using fireball = await createSeededSpellScroll({ title: "Fireball", mana_cost: 4 });
        await using decoy = await createSeededSpellScroll({ title: "Ice Spike", mana_cost: 2 });

        const ids = await harness.filterIds("spell-scrolls", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "title", operation: "exact_title", value: "Fireball" }]
            }
        });

        expect(ids).toEqual([fireball.id]);
        expect(ids).not.toContain(decoy.id);
    });
});

/**
 * Filter.pathCondition / usePathCondition are public, but FilterService never
 * calls usePathCondition when building queries.
 */
describe("Filter.pathCondition / usePathCondition", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("matches when all pathCondition keys are present with equal rule values", async () => {
        const response = await request(harness.app.getHttpServer())
            .post("/spell-scrolls-probes/path-condition")
            .send({
                pathCondition: { manaCost: 3 },
                query: {
                    condition: "and",
                    rules: [{ id: "manaCost", operation: FilterOperatorTypes.Equal, value: 3 }]
                }
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            matched: true,
            pathCondition: { manaCost: 3 }
        });
    });

    it("does not match when pathCondition values differ or keys are missing", async () => {
        const wrongValue = await request(harness.app.getHttpServer())
            .post("/spell-scrolls-probes/path-condition")
            .send({
                pathCondition: { manaCost: 3 },
                query: {
                    condition: "and",
                    rules: [{ id: "manaCost", operation: FilterOperatorTypes.Equal, value: 9 }]
                }
            });
        expect(wrongValue.status).toBe(200);
        expect(wrongValue.body.matched).toBe(false);

        const missing = await request(harness.app.getHttpServer())
            .post("/spell-scrolls-probes/path-condition")
            .send({
                pathCondition: { manaCost: 3 },
                query: { condition: "and", rules: [] }
            });
        expect(missing.status).toBe(200);
        expect(missing.body.matched).toBe(false);
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

describe("defaultFilterOptionConfig.maxPage", () => {
    let harness: DefaultAdaptersHarness;

    beforeAll(async () => {
        harness = await DefaultAdaptersHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("allows page.size up to the default maxPage of 100", async () => {
        const response = await harness.postFilter("locations", {
            page: { number: 0, size: 100 },
            query: { condition: "and", rules: [] }
        });
        expect(response.status).toBe(200);
    });

    it("rejects page.size above the default maxPage of 100", async () => {
        const response = await harness.postFilter("locations", {
            page: { number: 0, size: 101 },
            query: { condition: "and", rules: [] }
        });
        expect(response.status).toBe(400);
        expect(TestHarness.parseValidationMessage(response)).toContain("lower than 100");
    });
});

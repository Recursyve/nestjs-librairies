import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededHarborNotice } from "./seeds/create-seeded-harbor-notice";

describe("OpenApiFilterController + FilterResultModelMixin", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("exposes the same FilterController HTTP contract through the OpenAPI mixin", async () => {
        await using storm = await createSeededHarborNotice({ headline: "Storm Warning", priority: 1 });
        await using calm = await createSeededHarborNotice({ headline: "Calm Seas", priority: 9 });

        const all = await harness.filterIds("harbor-notices", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(all.sort()).toEqual([storm.id, calm.id].sort());

        const filtered = await harness.filterIds("harbor-notices", {
            page: TestHarness.defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "priority",
                        operation: FilterOperatorTypes.LessOrEqual,
                        value: 2
                    }
                ]
            }
        });
        expect(filtered).toEqual([storm.id]);

        const config = await harness.getFilterConfig("harbor-notices");
        expect(config.status).toBe(200);
        expect(TestHarness.parseFilterConfig(config).some((entry) => entry.id === "headline")).toBe(true);

        const count = await harness.postFilterCount("harbor-notices", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });
        expect(count.status).toBe(200);
        expect(harness.parseCountBody(count)).toBe(2);
    });
});

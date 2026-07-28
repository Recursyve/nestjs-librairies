import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DefaultAdaptersHarness } from "./harness/default-adapters-harness";
import { TestHarness } from "./harness/test-harness";
import { createSeededLocation } from "./seeds/create-seeded-location";

describe("default access control adapter", () => {
    let harness: DefaultAdaptersHarness;

    beforeAll(async () => {
        harness = await DefaultAdaptersHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns all rows when no user is deserialized", async () => {
        await using montreal = await createSeededLocation({ value: "Montreal", unique_code: "DA-1" });
        await using quebec = await createSeededLocation({ value: "Quebec", unique_code: "DA-2" });

        const ids = await harness.filterIds("locations", {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        expect(ids.sort()).toEqual([montreal.id, quebec.id].sort());
    });

    it("returns no rows when DefaultDeserializer provides a user", async () => {
        await using montreal = await createSeededLocation({ value: "Montreal", unique_code: "DA-3" });

        const response = await harness.postFilter(
            "locations",
            {
                page: TestHarness.defaultPage,
                query: { condition: "and", rules: [] }
            },
            true
        );

        expect(response.status).toBe(200);
        expect(TestHarness.mapFilterRowIds(TestHarness.parseFilterBody<{ id: number }>(response))).toEqual([]);
        expect(montreal.id).toBeGreaterThan(0);
    });
});

/**
 * @p0 legacy-contract
 * DefaultExportAdapter throws for html, pdf, and zip download types.
 */
describe("default export adapter", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it.each(["html", "pdf", "zip"] as const)("responds with 500 for %s downloads", async (type) => {
        const response = await harness.postDownload("persons", type, {
            page: TestHarness.defaultPage,
            query: { condition: "and", rules: [] }
        });

        TestHarness.expectInternalServerErrorFilterResponse(response);
    });
});

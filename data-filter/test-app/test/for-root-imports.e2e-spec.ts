import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ForRootImportsHarness } from "./harness/for-root-imports-harness";
import { TestHarness } from "./harness/test-harness";

describe("DataFilterModule.forRoot({ imports })", () => {
    let harness: ForRootImportsHarness;

    beforeAll(async () => {
        harness = await ForRootImportsHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("injects forRoot imports into root adapter providers", async () => {
        const response = await harness.getFilterConfig("locations");
        expect(response.status).toBe(200);
        const value = TestHarness.parseFilterConfig(response).find((entry) => entry.id === "value");
        expect(value?.name).toBe("root-import:filter.value.name");
    });
});

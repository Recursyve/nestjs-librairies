import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CharacterizationHarness, defaultPage, getCharacterizationHarness } from "./harness/characterization-harness";

describe("controller / decorator integration", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("exposes POST /persons/filter through FilterController", async () => {
        const response = await harness.postFilter("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Alice" }]
            }
        });

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(1);
        expect(response.body.values[0].first_name).toBe("Alice");
        expect(response.body.page).toEqual(defaultPage);
    });

    it("exposes POST /persons/filter-count", async () => {
        const response = await harness.postFilterCount("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "firstName", operation: FilterOperatorTypes.Equal, value: "Bob" }]
            }
        });

        expect(response.status).toBe(200);
        expect(harness.parseCountBody(response)).toBe(1);
    });

    it("exposes GET /persons/filter/config", async () => {
        const response = await harness.getFilterConfig("persons");

        expect(response.status).toBe(200);
        const ids = response.body.map((item: { id: string }) => item.id);
        expect(ids).toEqual(expect.arrayContaining(["firstName", "lastName", "email", "postalCode", "city"]));
    });

    it("wires @InjectFilter for contract-systems controller", async () => {
        const response = await harness.postFilter("contract-systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "active", operation: FilterOperatorTypes.Equal, value: "yes" }]
            }
        });

        expect(response.status).toBe(200);
        expect(response.body.total).toBeGreaterThan(0);
    });
});

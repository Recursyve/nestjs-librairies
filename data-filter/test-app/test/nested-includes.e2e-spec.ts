import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { CharacterizationHarness, defaultPage, getCharacterizationHarness } from "./harness/characterization-harness";

describe("nested includes / associations", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("filters persons on nested coord postal code", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "postalCode", operation: FilterOperatorTypes.Equal, value: "H1A1A1" }]
            }
        });

        expect(ids).toEqual([harness.seedIds.persons.alice]);
    });

    it("filters persons on deeply nested location value", async () => {
        const ids = await harness.filterIds("persons", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "city", operation: FilterOperatorTypes.Equal, value: "Quebec" }]
            }
        });

        expect(ids).toEqual([harness.seedIds.persons.bob]);
    });

    it("filters contract-systems on nested invoice paid flag", async () => {
        const ids = await harness.filterIds("contract-systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "invoicePaid", operation: FilterOperatorTypes.Equal, value: "paid" }]
            }
        });

        expect(ids.sort()).toEqual([harness.seedIds.contractSystems.cs1, harness.seedIds.contractSystems.cs2].sort());
    });

    it("filters contract-systems on nested system file number", async () => {
        const ids = await harness.filterIds("contract-systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "systemFileNumber", operation: FilterOperatorTypes.Equal, value: "SYS-TO-003" }]
            }
        });

        expect(ids).toEqual([harness.seedIds.contractSystems.cs3]);
    });

    it("returns nested owner person data in contract-system results", async () => {
        const response = await harness.postFilter("contract-systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "active", operation: FilterOperatorTypes.Equal, value: "yes" }]
            }
        });

        const cs1 = response.body.values.find((row: { id: number }) => row.id === harness.seedIds.contractSystems.cs1);
        expect(cs1.system.place.owners[0].person.email).toBe("alice@example.com");
    });
});

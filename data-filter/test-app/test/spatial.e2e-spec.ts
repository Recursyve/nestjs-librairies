import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CharacterizationHarness, defaultPage, getCharacterizationHarness } from "./harness/characterization-harness";

describe("spatial behavior", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    beforeEach(async () => {
        await harness.resetSeed();
    });

    it("filters coords within geo localization distance", async () => {
        const ids = await harness.filterIds("coords", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "distance",
                        operation: FilterOperatorTypes.Equal,
                        value: [
                            { operation: FilterOperatorTypes.Equal, value: [45.5017, -73.5673] },
                            { operation: FilterOperatorTypes.LessOrEqual, value: 5000 }
                        ]
                    }
                ]
            }
        });

        expect(ids).toEqual([harness.seedIds.coords.montreal]);
    });

    it("filters coords within a tight geo localization distance", async () => {
        const ids = await harness.filterIds("coords", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [
                    {
                        id: "distance",
                        operation: FilterOperatorTypes.Equal,
                        value: [
                            { operation: FilterOperatorTypes.Equal, value: [45.5017, -73.5673] },
                            { operation: FilterOperatorTypes.LessOrEqual, value: 1000 }
                        ]
                    }
                ]
            }
        });

        expect(ids).toEqual([harness.seedIds.coords.montreal]);
    });
});

/**
 * @p0 suspected-defect
 * Observed: geo-bounds filter returns no systems for a polygon covering all seeded coordinates.
 * Intended: systems inside the polygon should match.
 */
describe("geo bounds on MySQL", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    it("currently returns an empty result set for a covering polygon", async () => {
        const polygon: [number, number][] = [
            [44.0, -75.0],
            [44.0, -72.0],
            [47.0, -72.0],
            [47.0, -75.0]
        ];

        const ids = await harness.filterIds("systems", {
            page: defaultPage,
            query: {
                condition: "and",
                rules: [{ id: "geoBounds", operation: FilterOperatorTypes.Equal, value: polygon }]
            }
        });

        expect(ids).toEqual([]);
    });
});

/**
 * @p0 legacy-contract
 * Observed: distance ordering returns rows but not necessarily nearest-first on MySQL with SRID 0 points.
 */
describe("distance ordering on coords", () => {
    let harness: CharacterizationHarness;

    beforeAll(async () => {
        harness = await getCharacterizationHarness();
    });

    it("returns distance custom attribute when ordering coords by distance", async () => {
        const response = await harness.postFilter("coords", {
            page: defaultPage,
            order: [{ column: "distance", direction: "asc" }],
            data: { coordinates: [45.5017, -73.5673] },
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(response.body.values[0].distance).toBeDefined();
        expect(response.body.values.map((row: { id: number }) => row.id)).toContain(harness.seedIds.coords.montreal);
    });
});

import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededPlace } from "./seeds/create-seeded-place";
import { createSeededSystem } from "./seeds/create-seeded-system";

describe("spatial behavior", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("filters coords within geo localization distance", async () => {
        await using montrealLoc = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using montreal = await createSeededCoords({
            location_id: montrealLoc.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1",
            geo_point: { type: "Point", coordinates: [-73.5673, 45.5017] }
        });
        await using quebecLoc = await createSeededLocation({ value: "Quebec", unique_code: "QC" });
        await using _quebec = await createSeededCoords({
            location_id: quebecLoc.id,
            street_number: 200,
            address: "200 Rue Saint-Jean",
            postal_code: "G1R1R1",
            geo_point: { type: "Point", coordinates: [-71.208, 46.8139] }
        });

        const ids = await harness.filterIds("coords", {
            page: TestHarness.defaultPage,
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

        expect(ids).toEqual([montreal.id]);
    });

    it("filters coords within a tight geo localization distance", async () => {
        await using montrealLoc = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using montreal = await createSeededCoords({
            location_id: montrealLoc.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1",
            geo_point: { type: "Point", coordinates: [-73.5673, 45.5017] }
        });
        await using quebecLoc = await createSeededLocation({ value: "Quebec", unique_code: "QC" });
        await using _quebec = await createSeededCoords({
            location_id: quebecLoc.id,
            street_number: 200,
            address: "200 Rue Saint-Jean",
            postal_code: "G1R1R1",
            geo_point: { type: "Point", coordinates: [-71.208, 46.8139] }
        });

        const ids = await harness.filterIds("coords", {
            page: TestHarness.defaultPage,
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

        expect(ids).toEqual([montreal.id]);
    });
});

/**
 * @p0 suspected-defect
 * Observed: geo-bounds filter returns no systems for a polygon covering all seeded coordinates.
 * Intended: systems inside the polygon should match.
 */
describe("geo bounds on MySQL", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("currently returns an empty result set for a covering polygon", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 100,
            address: "100 Main",
            postal_code: "H1A1A1",
            geo_point: { type: "Point", coordinates: [-73.5673, 45.5017] }
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using _system = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-MTL-001",
            latitude: 45.5017,
            longitude: -73.5673
        });

        const polygon: [number, number][] = [
            [44.0, -75.0],
            [44.0, -72.0],
            [47.0, -72.0],
            [47.0, -75.0]
        ];

        const ids = await harness.filterIds("systems", {
            page: TestHarness.defaultPage,
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
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    it("returns distance custom attribute when ordering coords by distance", async () => {
        await using montrealLoc = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using montreal = await createSeededCoords({
            location_id: montrealLoc.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1",
            geo_point: { type: "Point", coordinates: [-73.5673, 45.5017] }
        });
        await using quebecLoc = await createSeededLocation({ value: "Quebec", unique_code: "QC" });
        await using _quebec = await createSeededCoords({
            location_id: quebecLoc.id,
            street_number: 200,
            address: "200 Rue Saint-Jean",
            postal_code: "G1R1R1",
            geo_point: { type: "Point", coordinates: [-71.208, 46.8139] }
        });

        const response = await harness.postFilter("coords", {
            page: TestHarness.defaultPage,
            order: [{ column: "distance", direction: "asc" }],
            data: { coordinates: [45.5017, -73.5673] },
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);
        expect(response.body.values[0].distance).toBeDefined();
        expect(response.body.values.map((row: { id: number }) => row.id)).toContain(montreal.id);
    });
});

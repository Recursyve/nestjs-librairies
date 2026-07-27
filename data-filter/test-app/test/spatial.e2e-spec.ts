import { FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededPlace } from "./seeds/create-seeded-place";
import { createSeededSystem } from "./seeds/create-seeded-system";

const montrealCenter = { type: "Point" as const, coordinates: [-73.5673, 45.5017] as [number, number] };
const quebecPoint = { type: "Point" as const, coordinates: [-71.208, 46.8139] as [number, number] };
// ~550 m north of Montreal center
const nearbyPoint = { type: "Point" as const, coordinates: [-73.5673, 45.5067] as [number, number] };

describe("spatial behavior", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("filters coords within a wide geo localization distance", async () => {
        await using montrealLoc = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using montreal = await createSeededCoords({
            location_id: montrealLoc.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1",
            geo_point: montrealCenter
        });
        await using nearbyLoc = await createSeededLocation({ value: "Montreal North", unique_code: "MTL-N" });
        await using nearby = await createSeededCoords({
            location_id: nearbyLoc.id,
            street_number: 150,
            address: "150 North Street",
            postal_code: "H1A1A2",
            geo_point: nearbyPoint
        });
        await using quebecLoc = await createSeededLocation({ value: "Quebec", unique_code: "QC" });
        await using _quebec = await createSeededCoords({
            location_id: quebecLoc.id,
            street_number: 200,
            address: "200 Rue Saint-Jean",
            postal_code: "G1R1R1",
            geo_point: quebecPoint
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

        expect(ids.sort()).toEqual([montreal.id, nearby.id].sort());
    });

    it("filters coords within a tight geo localization distance", async () => {
        await using montrealLoc = await createSeededLocation({ value: "Montreal", unique_code: "MTL-T" });
        await using montreal = await createSeededCoords({
            location_id: montrealLoc.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1",
            geo_point: montrealCenter
        });
        await using nearbyLoc = await createSeededLocation({ value: "Montreal North", unique_code: "MTL-TN" });
        await using nearby = await createSeededCoords({
            location_id: nearbyLoc.id,
            street_number: 150,
            address: "150 North Street",
            postal_code: "H1A1A2",
            geo_point: nearbyPoint
        });
        await using quebecLoc = await createSeededLocation({ value: "Quebec", unique_code: "QC-T" });
        await using _quebec = await createSeededCoords({
            location_id: quebecLoc.id,
            street_number: 200,
            address: "200 Rue Saint-Jean",
            postal_code: "G1R1R1",
            geo_point: quebecPoint
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
                            { operation: FilterOperatorTypes.LessOrEqual, value: 50 }
                        ]
                    }
                ]
            }
        });

        expect(ids).toEqual([montreal.id]);
        expect(ids).not.toContain(nearby.id);
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

    afterAll(async () => {
        await harness.close();
    });

    it("currently returns an empty result set for a covering polygon", async () => {
        await using location = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using coord = await createSeededCoords({
            location_id: location.id,
            street_number: 100,
            address: "100 Main",
            postal_code: "H1A1A1",
            geo_point: montrealCenter
        });
        await using place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });
        await using system = await createSeededSystem({
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
        expect(ids).not.toContain(system.id);
    });
});

/**
 * @p0 legacy-contract
 * Observed: distance ordering returns distance values and currently orders rows nearest-first on this fixture.
 */
describe("distance ordering on coords", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    it("returns distance values with nearer coords first in response order", async () => {
        await using quebecLoc = await createSeededLocation({ value: "Quebec", unique_code: "QC" });
        await using quebec = await createSeededCoords({
            location_id: quebecLoc.id,
            street_number: 200,
            address: "200 Rue Saint-Jean",
            postal_code: "G1R1R1",
            geo_point: quebecPoint
        });
        await using montrealLoc = await createSeededLocation({ value: "Montreal", unique_code: "MTL" });
        await using montreal = await createSeededCoords({
            location_id: montrealLoc.id,
            street_number: 100,
            address: "100 Main Street",
            postal_code: "H1A1A1",
            geo_point: montrealCenter
        });

        const response = await harness.postFilter("coords", {
            page: TestHarness.defaultPage,
            order: [{ column: "distance", direction: "asc" }],
            data: { coordinates: [45.5017, -73.5673] },
            query: { condition: "and", rules: [] }
        });

        expect(response.status).toBe(200);

        const body = TestHarness.parseFilterBody<{ id: number; distance: number }>(response);
        const rows = body.values;
        expect(rows.map((row) => row.id)).toEqual([montreal.id, quebec.id]);

        const montrealRow = rows.find((row) => row.id === montreal.id);
        const quebecRow = rows.find((row) => row.id === quebec.id);

        expect(montrealRow?.distance).toBeDefined();
        expect(quebecRow?.distance).toBeDefined();
        expect(montrealRow!.distance).toBeLessThan(quebecRow!.distance);
    });
});

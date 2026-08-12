import { DataFilterService, FilterOperatorTypes } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededMirroredCoords } from "./seeds/create-seeded-mirrored-coords";

const montrealCenter = { type: "Point" as const, coordinates: [-73.5673, 45.5017] as [number, number] };
const montrealLatLng: [number, number] = [45.5017, -73.5673];

/**
 * `legacyAxisOrder` exists for rows written with the latitude in the first coordinate, so each
 * case seeds both storages and asserts that a mode reads the storage it was made for.
 */
describe("legacyAxisOrder", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    async function seedBothStorages(suffix: string) {
        const nativeLocation = await createSeededLocation({ value: "Montreal", unique_code: `MTL-AXIS-${suffix}` });
        const native = await createSeededCoords({
            location_id: nativeLocation.id,
            street_number: 100,
            address: "100 Native",
            postal_code: "H1A1A1",
            geo_point: montrealCenter
        });
        const mirroredLocation = await createSeededLocation({ value: "Montreal", unique_code: `MTL-MIRROR-${suffix}` });
        const mirrored = await createSeededMirroredCoords({
            location_id: mirroredLocation.id,
            street_number: 200,
            address: "200 Mirrored",
            postal_code: "H1A1A2",
            geo_point: montrealCenter
        });

        return { nativeLocation, native, mirroredLocation, mirrored };
    }

    it("projects a zero distance for the storage each mode targets", async () => {
        const seeded = await seedBothStorages("DIST");
        await using _nativeLocation = seeded.nativeLocation;
        await using native = seeded.native;
        await using _mirroredLocation = seeded.mirroredLocation;
        await using mirrored = seeded.mirrored;

        const { CoordsAxisOrderData } = await import("../src/coords/filters/coords-axis-order.filter");
        const repo = harness.app.get(DataFilterService).for(CoordsAxisOrderData);
        const rows = (await repo.findAll(
            { where: { id: [native.id, mirrored.id] } },
            { coordinates: montrealLatLng }
        )) as unknown as { id: number; distance: number; legacy_distance: number }[];

        const nativeRow = rows.find((row) => row.id === native.id);
        const mirroredRow = rows.find((row) => row.id === mirrored.id);

        expect(nativeRow?.distance).toBe(0);
        expect(mirroredRow?.legacy_distance).toBe(0);
        expect(nativeRow?.legacy_distance).toBeGreaterThan(1_000_000);
        expect(mirroredRow?.distance).toBeGreaterThan(1_000_000);
    });

    it("matches the storage each geo localization mode targets", async () => {
        const seeded = await seedBothStorages("GEOLOC");
        await using _nativeLocation = seeded.nativeLocation;
        await using native = seeded.native;
        await using _mirroredLocation = seeded.mirroredLocation;
        await using mirrored = seeded.mirrored;

        async function idsFor(filterId: string) {
            return harness.filterIds("coords-axis-order", {
                page: TestHarness.defaultPage,
                query: {
                    condition: "and",
                    rules: [
                        {
                            id: filterId,
                            operation: FilterOperatorTypes.Equal,
                            value: [
                                { operation: FilterOperatorTypes.Equal, value: montrealLatLng },
                                { operation: FilterOperatorTypes.LessOrEqual, value: 50 }
                            ]
                        }
                    ]
                }
            });
        }

        expect(await idsFor("distance")).toEqual([native.id]);
        expect(await idsFor("legacyDistance")).toEqual([mirrored.id]);
    });

    it("contains the storage each geo bounds mode targets", async () => {
        const seeded = await seedBothStorages("BOUNDS");
        await using _nativeLocation = seeded.nativeLocation;
        await using native = seeded.native;
        await using _mirroredLocation = seeded.mirroredLocation;
        await using mirrored = seeded.mirrored;

        const polygon: [number, number][] = [
            [44.0, -75.0],
            [44.0, -72.0],
            [47.0, -72.0],
            [47.0, -75.0]
        ];

        async function idsFor(filterId: string) {
            return harness.filterIds("coords-axis-order", {
                page: TestHarness.defaultPage,
                query: {
                    condition: "and",
                    rules: [{ id: filterId, operation: FilterOperatorTypes.Equal, value: polygon }]
                }
            });
        }

        expect(await idsFor("bounds")).toEqual([native.id]);
        expect(await idsFor("legacyBounds")).toEqual([mirrored.id]);
    });
});

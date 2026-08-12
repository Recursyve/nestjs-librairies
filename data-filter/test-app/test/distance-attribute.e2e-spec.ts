import { DataFilterService } from "@recursyve/nestjs-data-filter";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TestHarness } from "./harness/test-harness";
import { createSeededCoords } from "./seeds/create-seeded-coords";
import { createSeededLocation } from "./seeds/create-seeded-location";
import { createSeededPlace } from "./seeds/create-seeded-place";
import { createSeededSystem } from "./seeds/create-seeded-system";

const montrealCenter = { type: "Point" as const, coordinates: [-73.5673, 45.5017] as [number, number] };
const quebecPoint = { type: "Point" as const, coordinates: [-71.208, 46.8139] as [number, number] };

/**
 * systems.latitude / systems.longitude are INT columns, so the fixtures use whole
 * degrees to keep the expected distances exact.
 */
const montrealDegrees = { latitude: 45, longitude: -73 };
const quebecDegrees = { latitude: 47, longitude: -71 };

describe("@Distance custom attribute", () => {
    let harness: TestHarness;

    beforeAll(async () => {
        harness = await TestHarness.create();
    });

    afterAll(async () => {
        await harness.close();
    });

    async function seedPlaces() {
        const montrealLocation = await createSeededLocation({ value: "Montreal", unique_code: "MTL-DIST" });
        const montrealCoord = await createSeededCoords({
            location_id: montrealLocation.id,
            street_number: 100,
            address: "100 Main",
            postal_code: "H1A1A1",
            geo_point: montrealCenter
        });
        const quebecLocation = await createSeededLocation({ value: "Quebec", unique_code: "QC-DIST" });
        const quebecCoord = await createSeededCoords({
            location_id: quebecLocation.id,
            street_number: 200,
            address: "200 Saint-Jean",
            postal_code: "G1R1R1",
            geo_point: quebecPoint
        });

        return { montrealLocation, montrealCoord, quebecLocation, quebecCoord };
    }

    it("resolves a @Distance declared on an included property against the include alias", async () => {
        const seeded = await seedPlaces();
        await using montrealLocation = seeded.montrealLocation;
        await using montrealCoord = seeded.montrealCoord;
        await using quebecLocation = seeded.quebecLocation;
        await using quebecCoord = seeded.quebecCoord;
        await using montrealPlace = await createSeededPlace({
            billing_coord_id: montrealCoord.id,
            geo_coord_id: montrealCoord.id
        });
        await using quebecPlace = await createSeededPlace({
            billing_coord_id: quebecCoord.id,
            geo_coord_id: quebecCoord.id
        });

        const { PlacesIncludedDistanceData } = await import("../src/places/filters/places-distance.data");
        const repo = harness.app.get(DataFilterService).for(PlacesIncludedDistanceData);
        const result = await repo.findAll(
            { where: { id: [montrealPlace.id, quebecPlace.id] } },
            { coordinates: [45.5017, -73.5673] }
        );

        /**
         * An included row comes back as a Sequelize instance, which only exposes
         * getters for declared columns. The custom attribute lives in dataValues,
         * so it surfaces through serialization — the shape an HTTP consumer sees.
         */
        const rows = JSON.parse(JSON.stringify(result)) as {
            id: number;
            geoCoord?: { address?: string; distance?: number };
        }[];

        const montrealRow = rows.find((row) => row.id === montrealPlace.id);
        const quebecRow = rows.find((row) => row.id === quebecPlace.id);

        expect(montrealRow?.geoCoord?.address).toBe("100 Main");
        expect(montrealRow?.geoCoord?.distance).toBe(0);
        expect(quebecRow?.geoCoord?.distance).toBeGreaterThan(200_000);
        expect(montrealLocation.id).toBeGreaterThan(0);
        expect(quebecLocation.id).toBeGreaterThan(0);
    });

    it("omits the distance when the coordinates cannot be resolved", async () => {
        const seeded = await seedPlaces();
        await using _montrealLocation = seeded.montrealLocation;
        await using montrealCoord = seeded.montrealCoord;
        await using _quebecLocation = seeded.quebecLocation;
        await using _quebecCoord = seeded.quebecCoord;
        await using montrealPlace = await createSeededPlace({
            billing_coord_id: montrealCoord.id,
            geo_coord_id: montrealCoord.id
        });

        const { PlacesIncludedDistanceData } = await import("../src/places/filters/places-distance.data");
        const repo = harness.app.get(DataFilterService).for(PlacesIncludedDistanceData);
        const result = await repo.findAll({ where: { id: montrealPlace.id } });
        const rows = JSON.parse(JSON.stringify(result)) as {
            id: number;
            geoCoord?: { address?: string; distance?: number };
        }[];

        expect(rows).toHaveLength(1);
        expect(rows[0].geoCoord?.address).toBe("100 Main");
        expect(rows[0].geoCoord).not.toHaveProperty("distance");
    });

    async function seedSystemsPlace(uniqueCode: string) {
        const location = await createSeededLocation({ value: "Montreal", unique_code: uniqueCode });
        const coord = await createSeededCoords({
            location_id: location.id,
            street_number: 100,
            address: "100 Main",
            postal_code: "H1A1A1",
            geo_point: montrealCenter
        });
        const place = await createSeededPlace({ billing_coord_id: coord.id, geo_coord_id: coord.id });

        return { location, coord, place };
    }

    it("computes the distance from separate lat/lng columns", async () => {
        const seeded = await seedSystemsPlace("MTL-LATLNG");
        await using _location = seeded.location;
        await using _coord = seeded.coord;
        await using place = seeded.place;
        await using montrealSystem = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-MTL-DIST",
            ...montrealDegrees
        });
        await using quebecSystem = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-QC-DIST",
            ...quebecDegrees
        });

        const { SystemsLatLngDistanceData } = await import("../src/systems/filters/systems-distance.data");
        const repo = harness.app.get(DataFilterService).for(SystemsLatLngDistanceData);
        const rows = (await repo.findAll(
            { where: { id: [montrealSystem.id, quebecSystem.id] } },
            { coordinates: [montrealDegrees.latitude, montrealDegrees.longitude] }
        )) as unknown as { id: number; distance?: number }[];

        expect(rows.find((row) => row.id === montrealSystem.id)?.distance).toBe(0);
        expect(rows.find((row) => row.id === quebecSystem.id)?.distance).toBeGreaterThan(200_000);
    });

    /**
     * @p0 suspected-defect
     * With an explicit srid the projected point and the reference point no longer
     * agree on the axis order, so an exact match does not collapse to zero.
     */
    it("returns a non-zero distance for an exact match when srid is set", async () => {
        const seeded = await seedSystemsPlace("MTL-SRID");
        await using _location = seeded.location;
        await using _coord = seeded.coord;
        await using place = seeded.place;
        await using montrealSystem = await createSeededSystem({
            place_id: place.id,
            file_number: "SYS-MTL-SRID",
            ...montrealDegrees
        });

        const { SystemsSridDistanceData } = await import("../src/systems/filters/systems-distance.data");
        const repo = harness.app.get(DataFilterService).for(SystemsSridDistanceData);
        const rows = (await repo.findAll(
            { where: { id: montrealSystem.id } },
            { coordinates: [montrealDegrees.latitude, montrealDegrees.longitude] }
        )) as unknown as { id: number; distance?: number }[];

        expect(rows).toHaveLength(1);
        expect(rows[0].distance).toBeGreaterThan(1_000_000);
    });
});

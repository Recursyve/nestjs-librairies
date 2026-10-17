import { describe, expect, it } from "vitest";

import { GEO_POINT_SRID, GeoPoint } from "./sequelize.utils";

describe(GeoPoint, () => {
    it("uses the GeoJSON point type", () => {
        expect.assertions(1);

        const point = new GeoPoint([-73.5, 45.5]);

        expect(point.type).toBe("Point");
    });

    it("stores the coordinates array", () => {
        expect.assertions(1);

        const point = new GeoPoint([-73.5, 45.5]);

        expect(point.coordinates).toStrictEqual([-73.5, 45.5]);
    });
});

describe("geoPointSrid", () => {
    it("is the WGS 84 spatial reference identifier", () => {
        expect.assertions(1);

        expect(GEO_POINT_SRID).toBe(4326);
    });
});

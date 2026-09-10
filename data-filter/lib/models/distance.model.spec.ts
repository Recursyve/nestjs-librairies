import { fn, literal, ProjectionAlias } from "sequelize";
import { DistanceAttributesConfig } from "./distance.model";

describe("DistanceAttributesConfig", () => {
    describe("transform", () => {
        it("should compare the column against a longitude-first point", () => {
            const config = new DistanceAttributesConfig("distance", {
                name: "distance",
                attribute: "geo_point",
                coordinates: () => [45.8797953, -73.2815516]
            });

            const projection = config.transform({});

            expect(projection).toStrictEqual<ProjectionAlias>([
                fn("ST_Distance_Sphere", literal("geo_point"), fn("Point", -73.2815516, 45.8797953)),
                "distance"
            ]);
        });

        it("with legacy axis order should compare the column against a latitude-first WKT point", () => {
            const config = new DistanceAttributesConfig("distance", {
                name: "distance",
                attribute: "geo_point",
                coordinates: () => [45.8797953, -73.2815516],
                legacyAxisOrder: true
            });

            const projection = config.transform({});

            expect(projection).toStrictEqual<ProjectionAlias>([
                fn(
                    "ST_Distance_Sphere",
                    literal("geo_point"),
                    fn("ST_GeometryFromText", literal("'POINT(45.8797953 -73.2815516)'"), 0)
                ),
                "distance"
            ]);
        });

        it("with legacy axis order and a srid should label the WKT point with that srid", () => {
            const config = new DistanceAttributesConfig("distance", {
                name: "distance",
                attribute: "geo_point",
                coordinates: () => [45.8797953, -73.2815516],
                srid: 4326,
                legacyAxisOrder: true
            });

            const projection = config.transform({});

            expect(projection).toStrictEqual<ProjectionAlias>([
                fn(
                    "ST_Distance_Sphere",
                    literal("geo_point"),
                    fn("ST_GeometryFromText", literal("'POINT(45.8797953 -73.2815516)'"), 4326)
                ),
                "distance"
            ]);
        });
    });
});

import { SchemaFactory } from "@nestjs/mongoose";
import { Connection, Schema } from "mongoose";
import { databaseFactory } from "../test/database.factory";
import { Owners } from "../test/models/places/owners.model";
import { MongoSchemaScanner } from "./mongo-schema.scanner";

describe("MongoSchemaScanner", () => {
    let connection: Connection;
    let scanner: MongoSchemaScanner;
    let schema: Schema<Owners>;

    beforeAll(async () => {
        connection = await databaseFactory();
        scanner = new MongoSchemaScanner(connection);
        schema = SchemaFactory.createForClass(Owners);
    });

    afterAll(async () => {
        await connection.close(true);
    });

    it("getLookups should return a valid lookup aggregation", async () => {
        const placesLookups = scanner.getLookups(schema, "places.geoCoord.location");
        expect(placesLookups).toBeDefined();
        expect(placesLookups).toStrictEqual([
            {
                $lookup: {
                    from: "places",
                    let: { placesId: "$places" },
                    as: "places",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ["$_id", "$$placesId"]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "coords",
                                let: { geoCoordId: "$geoCoord" },
                                as: "geoCoord",
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$_id", "$$geoCoordId"]
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "locations",
                                            let: { locationId: "$location" },
                                            as: "location",
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            $eq: ["$_id", "$$locationId"]
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                    },
                                    {
                                        $unwind: {
                                            path: `$location`,
                                            preserveNullAndEmptyArrays: true
                                        }
                                    }
                                ]
                            },
                        },
                        {
                            $unwind: {
                                path: `$geoCoord`,
                                preserveNullAndEmptyArrays: true
                            }
                        }
                    ]
                }
            }
        ]);
    });

    it("getSchemaFields should return all field in schema", () => {
        const fields = scanner.getSchemaFields(schema);
        expect(fields).toBeDefined();
    });

    it("getFields should return all field in schema", () => {
        const fields = scanner.getFields(schema, "places");
        expect(fields).toBeDefined();
    });
});

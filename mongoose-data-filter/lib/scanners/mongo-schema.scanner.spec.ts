import { SchemaFactory } from "@nestjs/mongoose";
import { Connection, Schema } from "mongoose";
import { databaseFactory } from "../test/database.factory";
import { Accounts } from "../test/models/accounts/accounts.model";
import { Owners } from "../test/models/places/owners.model";
import { Places } from "../test/models/places/places.model";
import { MongoSchemaScanner } from "./mongo-schema.scanner";

describe("MongoSchemaScanner", () => {
    let connection: Connection;
    let scanner: MongoSchemaScanner;
    let ownersSchema: Schema<Owners>;
    let accountsSchema: Schema<Accounts>;
    let placesSchema: Schema<Places>;

    beforeAll(async () => {
        connection = await databaseFactory();
        scanner = new MongoSchemaScanner(connection);
        ownersSchema = SchemaFactory.createForClass(Owners);
        accountsSchema = SchemaFactory.createForClass(Accounts);
        placesSchema = SchemaFactory.createForClass(Places);
    });

    afterAll(async () => {
        await connection.close(true);
    });

    it("getLookups should return a valid lookup aggregation", async () => {
        const placesLookups = scanner.getLookups(ownersSchema, "places.geoCoord", [
            {
                path: "location"
            }
        ]);
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

    it("getLookups with reverse ref should return a valid lookup aggregation", async () => {
        const placesLookups = scanner.getLookups(placesSchema, "owners.account", []);
        expect(placesLookups).toBeDefined();
        expect(placesLookups).toStrictEqual([]);
    });

    it("getSchemaFields should return all field in schema", () => {
        const fields = scanner.getSchemaFields(accountsSchema);
        expect(fields).toBeDefined();
        expect(fields).toStrictEqual([
            "lastName",
            "firstName",
            "email",
            "userId"
        ]);
    });

    it("getFields should return all field in schema", () => {
        const fields = scanner.getFields(ownersSchema, "places", [
            {
                path: "geoCoord"
            },
            {
                path: "geoCoord.location"
            }
        ]);
        expect(fields).toBeDefined();
        expect(fields).toStrictEqual([
            "places.$.geoCoord.postalCode",
            "places.$.geoCoord.address2",
            "places.$.geoCoord.address",
            "places.$.geoCoord.streetNumber",
            "places.$.geoCoord.location.uniqueCode",
            "places.$.geoCoord.location.value"
        ])
    });
});

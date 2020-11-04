import { SchemaFactory } from "@nestjs/mongoose";
import { Aggregate, Connection, Schema } from "mongoose";
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

    it("getLookups should return a valid lookup aggregation", () => {
        const placesLookups = new Aggregate(scanner.getLookups(schema, "places"));
        expect(placesLookups).toBeDefined();
        expect(placesLookups).toStrictEqual(
            new Aggregate().lookup({
                from: "places",
                localField: "places",
                foreignField: "_id",
                as: "places"
            })
        );

        const accountsLookups = new Aggregate(scanner.getLookups(schema, "account"));
        expect(accountsLookups).toBeDefined();
        expect(accountsLookups).toStrictEqual(
            new Aggregate().lookup({
                from: "accounts",
                localField: "account",
                foreignField: "_id",
                as: "account"
            }).unwind({
                path: "$account",
                preserveNullAndEmptyArrays: true
            })
        );
    });
});

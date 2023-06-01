import { Connection, Document, Model } from "mongoose";
import { DefaultAccessControlAdapter, DefaultExportAdapter, DefaultTranslateAdapter } from "./adapters";
import { DataFilterRepository } from "./data-filter.repository";
import { Where } from "./decorators";
import { Attributes } from "./decorators/attributes.decorator";
import { Data } from "./decorators/data.decorator";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { MongoSchemaScanner } from "./scanners/mongo-schema.scanner";
import { databaseFactory } from "./test/database.factory";
import { Accounts } from "./test/models/accounts/accounts.model";
import { Coords } from "./test/models/coords/coords.model";

@Data(Accounts)
class AccountsTest extends Accounts {
    @Attributes()
    @Where({
        location: () => ({ $ne: null })
    })
    coord: Coords;
}

describe("DataFilterRepository", () => {
    let connection: Connection;
    let scanner: MongoSchemaScanner;
    let accountsModel: Model<Accounts & Document>;

    beforeAll(async () => {
        connection = await databaseFactory();
        scanner = new MongoSchemaScanner(connection);
        accountsModel = connection.model(Accounts.name);
    });

    afterAll(async () => {
        await connection.close(true);
    });

    describe("AccountsTest", () => {
        let repository: DataFilterRepository<AccountsTest>;

        beforeAll(() => {
            repository = new DataFilterRepository(
                AccountsTest,
                new DataFilterScanner(),
                new MongoSchemaScanner(connection),
                new DefaultAccessControlAdapter(),
                new DefaultTranslateAdapter(),
                new DefaultExportAdapter(),
                connection
            );
        });

        it("getFilterAggregation should return a valid mongo aggregation", () => {
            const options = repository.getFilterAggregation();
            expect(options).toBeDefined();
            expect(options).toStrictEqual(
                accountsModel.aggregate()
                    .lookup({
                        from: "coords",
                        let: { coordId: "$coord" },
                        as: "coord",
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                location: {
                                                    $ne: null
                                                }
                                            },
                                            {
                                                $eq: ["$_id", "$$coordId"]
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    })
                    .unwind({
                        path: "$coord",
                        preserveNullAndEmptyArrays: true
                    })
            );
        });

        it("getFilterAggregation with conditions should return a valid mongo aggregation", () => {
            const options = repository.getFilterAggregation({ userId: "myId" });
            expect(options).toBeDefined();
            expect(options).toStrictEqual(
                accountsModel.aggregate()
                    .lookup({
                        from: "coords",
                        let: { coordId: "$coord" },
                        as: "coord",
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            {
                                                location: {
                                                    $ne: null
                                                }
                                            },
                                            {
                                                $eq: ["$_id", "$$coordId"]
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    })
                    .unwind({
                        path: "$coord",
                        preserveNullAndEmptyArrays: true
                    })
                    .match({
                        userId: "myId"
                    })
            );
        });
    });
});

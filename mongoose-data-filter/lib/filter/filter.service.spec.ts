import { Injectable } from "@nestjs/common";
import { Connection } from "mongoose";
import { DefaultAccessControlAdapter, DefaultTranslateAdapter } from "../adapters";
import { DataFilterService } from "../data-filter.service";
import { Where } from "../decorators";
import { Attributes } from "../decorators/attributes.decorator";
import { Data } from "../decorators/data.decorator";
import { DataFilterScanner } from "../scanners/data-filter.scanner";
import { MongoSchemaScanner } from "../scanners/mongo-schema.scanner";
import { databaseFactory } from "../test/database.factory";
import { Accounts } from "../test/models/accounts/accounts.model";
import { Owners } from "../test/models/places/owners.model";
import { Places } from "../test/models/places/places.model";
import { BaseFilter } from "./base-filter";
import { FilterService } from "./filter.service";
import { TextFilter } from "./filters";
import { DefaultFilter } from "./filters/default.filter";
import { FilterOperatorTypes } from "./operators";

@Data(Owners)
class OwnersTest extends Owners {
    @Attributes()
    @Where({
        email: () => ({ $ne: null })
    })
    account: Accounts

    @Attributes()
    places: Places[];
}

@Injectable()
export class TestFilter extends BaseFilter<OwnersTest> {
    public dataDefinition = OwnersTest;

    public defaultFilter = new DefaultFilter({
        id: "email",
        operation: FilterOperatorTypes.Contains,
        value: "@"
    });

    public email = new TextFilter({
        attribute: "email",
        path: "account",
        group: "owner"
    });

    public name = new TextFilter({
        attribute: "firstName",
        path: "account",
        group: "owner"
    });
}

describe("FilterService", () => {
    let connection: Connection;
    let filterService: FilterService<OwnersTest>;

    beforeAll(async () => {
        connection = await databaseFactory();
        filterService = new FilterService<OwnersTest>(
            new DefaultAccessControlAdapter(),
            new DefaultTranslateAdapter(),
            new TestFilter(),
            new MongoSchemaScanner(connection),
            new DataFilterService(
                connection,
                new DataFilterScanner(),
                new MongoSchemaScanner(connection),
            )
        );
    });

    afterAll(async () => {
        await connection.close(true);
    });

    it("getFilterPipeline should return a valid mongo pipeline", async () => {
        const options = await filterService.getFilterPipeline(connection.model(Owners.name), {
            query: {
                condition: "and",
                rules: [
                    {
                        id: "name",
                        value: "John",
                        operation: FilterOperatorTypes.Equal
                    }
                ]
            },
            search: {
                value: "Doe"
            }
        });
        expect(options).toBeDefined();
        expect(options).toStrictEqual([
            {
                $lookup: {
                    from: "accounts",
                    let: { accountId: "$account" },
                    as: "account",
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$accountId"]
                                }
                            }
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$account",
                    preserveNullAndEmptyArrays: true
                }
            },
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
                        }
                    ]
                }
            },
            {
                $match: {
                    $and: [
                        {
                            $or: [
                                {
                                    $or: {
                                        "account.firstName": {
                                            $eq: new RegExp(`.*Doe.*`, "i")
                                        },
                                        "account.lastName": {
                                            $eq: new RegExp(`.*Doe.*`, "i")
                                        },
                                        "account.email": {
                                            $eq: new RegExp(`.*Doe.*`, "i")
                                        },
                                        "account.userId": {
                                            $eq: new RegExp(`.*Doe.*`, "i")
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            $and: [
                                {
                                    "account.firstName": "John"
                                },
                                {
                                    "account.email": {
                                        $eq: new RegExp(`.*@.*`, "i")
                                    }
                                }
                            ]
                        }
                    ]
                }
            }
        ]);
    });
});

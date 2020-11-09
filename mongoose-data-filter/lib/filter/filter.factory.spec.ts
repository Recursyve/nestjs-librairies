import { Injectable } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DataFilterModule } from "../../../data-filter/lib";
import { Attributes, Where } from "../decorators";
import { Data } from "../decorators/data.decorator";
import { DataFilterScanner } from "../scanners/data-filter.scanner";
import { MongoSchemaScanner } from "../scanners/mongo-schema.scanner";
import { Accounts } from "../test/models/accounts/accounts.model";
import { Owners } from "../test/models/places/owners.model";
import { BaseFilter } from "./base-filter";
import { TextFilter } from "./filters";

@Data(Owners)
class OwnersTest extends Owners {
    @Attributes()
    @Where({
        email: () => ({ $ne: null })
    })
    account: Accounts
}

@Injectable()
export class TestFilter extends BaseFilter<OwnersTest> {
    public dataDefinition = OwnersTest;

    public email = new TextFilter({
        attribute: "email",
        path: "account",
        group: "owner"
    });

    constructor(scanner: MongoSchemaScanner, scanner2: DataFilterScanner) {
        super();
    }
}

describe("FilterFactory", () => {
    it("with missing dependencies should throw an error", async () => {
        expect.assertions(1);
        await expect(Test.createTestingModule({
            imports: [
                DataFilterModule.forRoot(),
                DataFilterModule.forFeature({
                    filters: [
                        {
                            filter: TestFilter
                        }
                    ]
                })
            ]
        }).compile()).rejects.toEqual(new Error("Not enough dependencies were provided for TestFilter: expected 2, received 0"));
    });
});

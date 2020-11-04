import { Injectable } from "@nestjs/common";
import { DefaultAccessControlAdapter, DefaultTranslateAdapter } from "../adapters";
import { DataFilterService } from "../data-filter.service";
import { Attributes } from "../decorators/attributes.decorator";
import { Data } from "../decorators/data.decorator";
import { DataFilterScanner } from "../scanners/data-filter.scanner";
import { MongoSchemaScanner } from "../scanners/mongo-schema.scanner";
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
    account: Accounts
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
        attribute: "first_name",
        path: "account",
        group: "owner"
    });
}

describe("FilterService", () => {
    let filterService: FilterService<OwnersTest>;

    beforeAll(() => {
        filterService = new FilterService<OwnersTest>(
            new DefaultAccessControlAdapter(),
            new DefaultTranslateAdapter(),
            new TestFilter(),
            new MongoSchemaScanner(null),
            new DataFilterService(
                new DataFilterScanner(),
                new MongoSchemaScanner(null)
            )
        );
    });

    it("getFindOptions should return a valid Sequelize FindOptions", async () => {
        const options = await filterService.getFindOptions(ContractSystems, {
            condition: "and",
            rules: [
                {
                    id: "email",
                    value: null,
                    operation: "none"
                },
                {
                    id: "name",
                    value: "John",
                    operation: FilterOperatorTypes.Equal
                },
                {
                    id: "visitCount",
                    value: 2,
                    operation: FilterOperatorTypes.GreaterOrEqual
                }
            ]
        });
        expect(options).toBeDefined();
        expect(options).toStrictEqual([]);
    });
});

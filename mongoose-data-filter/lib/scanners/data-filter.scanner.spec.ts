import { Attributes } from "../decorators/attributes.decorator";
import { Data } from "../decorators/data.decorator";
import { Accounts } from "../test/models/accounts/accounts.model";
import { DataFilterScanner } from "./data-filter.scanner";
import { Coords } from "../test/models/coords/coords.model";
import { DataFilterConfig, DataFilterConfigModel } from "../models/data-filter.model";
import { AttributesConfig, AttributesConfigModel } from "../models/attributes.model";

@Data(Accounts)
class AccountsTest extends Accounts {
    @Attributes()
    coord: Coords;
}

describe("DataFilterScanner", () => {
    let scanner: DataFilterScanner;

    beforeAll(() => {
        scanner = new DataFilterScanner();
    });

    it("getDataFilter should return the valid DataFilterConfig", () => {
        const model = scanner.getDataFilter(AccountsTest);
        expect(model).toBeDefined();
        const expected = new DataFilterConfig();
        Object.assign<DataFilterConfig, DataFilterConfigModel>(expected, {
            model: Accounts,
            fieldsToAdd: []
        });
        expect(model).toStrictEqual(expected);
    });

    it("getAttributes should return the valid AttributesConfig array", () => {
        const attributes = scanner.getAttributes(AccountsTest);
        expect(attributes).toBeDefined();
        const expected = [
            new AttributesConfig("coord")
        ];
        Object.assign<AttributesConfig, AttributesConfigModel>(expected[0], {
            key: "coord",
            path: {
                path: "coord"
            },
            fieldsToAdd: [],
            includes: [],
            ignoreInSearch: false
        });
        expect(JSON.stringify(attributes)).toStrictEqual(JSON.stringify(expected));
    });
});

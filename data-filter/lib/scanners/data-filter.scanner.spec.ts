import { DataFilterScanner } from "./data-filter.scanner";
import { Attributes, Data, Include, Path } from "../decorators";
import { Persons } from "../test/models/persons/persons.model";
import { Coords } from "../test/models/coords/coords.model";
import { Places } from "../test/models/places/places.model";
import { DataFilterConfig, DataFilterConfigModel } from "../models/data-filter.model";
import { AttributesConfig, AttributesConfigModel } from "../models/attributes.model";

@Data(Persons)
@Attributes(["first_name", "last_name"])
class PersonsTest {
    @Attributes(["cellphone"])
    coord: Coords;

    @Attributes([])
    @Path("owner.places")
    @Include({ path: "system", attributes: ["file_number"], where: { file_number: option => option.file_number } })
    places: Places[];
}

describe("DataFilterScanner", () => {
    let scanner: DataFilterScanner;

    beforeAll(() => {
        scanner = new DataFilterScanner();
    });

    it("getDataFilter should return the valid DataFilterConfig", () => {
        const model = scanner.getDataFilter(PersonsTest);
        expect(model).toBeDefined();
        const expected = new DataFilterConfig();
        Object.assign<DataFilterConfig, DataFilterConfigModel>(expected, {
            model: Persons,
            attributes: ["first_name", "last_name"],
            customAttributes: []
        });
        expect(model).toStrictEqual(expected);
    });

    it("getAttributes should return the valid AttributesConfig array", () => {
        const attributes = scanner.getAttributes(PersonsTest);
        expect(attributes).toBeDefined();
        const expected = [
            new AttributesConfig("coord"),
            new AttributesConfig("places")
        ];
        Object.assign<AttributesConfig, AttributesConfigModel>(expected[0], {
            key: "coord",
            attributes: ["cellphone"],
            path: {
                path: "coord"
            },
            customAttributes: [],
            includes: []
        });
        Object.assign<AttributesConfig, AttributesConfigModel>(expected[1], {
            key: "places",
            attributes: [],
            path: {
                path: "owner.places"
            },
            customAttributes: [],
            includes: [
                {
                    path: "system",
                    attributes: ["file_number"],
                    where: { file_number: option => option.file_number }
                }
            ]
        });
        expect(JSON.stringify(attributes)).toStrictEqual(JSON.stringify(expected));
    });
});

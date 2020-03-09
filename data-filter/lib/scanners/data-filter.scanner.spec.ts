import { DataFilterScanner } from "./data-filter.scanner";
import { Attributes, Data, Include, Path } from "../decorators";
import { Persons } from "../test/models/persons/persons.model";
import { Coords } from "../test/models/coords/coords.model";
import { Places } from "../test/models/places/places.model";

@Data(Persons)
@Attributes(["first_name", "last_name"])
class PersonsTest {
    @Attributes(["cellphone"])
    @Path("coord")
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

    it("getModel should return the valid Sequelize Typescript Model", () => {
        const model = scanner.getModel(PersonsTest);
        expect(model).toBeDefined();
        expect(model).toStrictEqual(Persons);
    });

    it("getModelAttributes should return the valid findAttributes", () => {
        const attributes = scanner.getModelAttributes(PersonsTest);
        expect(attributes).toBeDefined();
        expect(attributes).toStrictEqual(["first_name", "last_name"]);
    });

    it("getPath should return the valid include path", () => {
        const path = scanner.getPath(PersonsTest, "coord");
        expect(path).toBeDefined();
        expect(path).toHaveProperty("path", "coord");
    });

    it("getInclude should return the valid include option", () => {
        const include = scanner.getInclude(PersonsTest, "places");
        expect(include).toBeDefined();
        expect(include).toStrictEqual([
            {
                path: "system",
                attributes: ["file_number"]
            }
        ]);
    });

    it("getInclude with options should return the valid include option", () => {
        const include = scanner.getInclude(PersonsTest, "places", { file_number: "123456" });
        expect(include).toBeDefined();
        expect(include).toStrictEqual([
            {
                path: "system",
                attributes: ["file_number"],
                where: {
                    file_number: "123456"
                }
            }
        ]);
    });
});

import { databaseFactory } from "./test/database.factory";
import { DataFilterRepository } from "./data-filter.repository";
import { Attributes, Data, Include, Path } from "./decorators";
import { DataFilterScanner } from "./scanners/data-filter.scanner";
import { SequelizeModelScanner } from "./scanners/sequelize-model.scanner";
import { Persons } from "./test/models/persons/persons.model";
import { Coords } from "./test/models/coords/coords.model";
import { Locations } from "./test/models/locations/locations.model";

@Data(Persons)
@Attributes(["first_name", "last_name"])
class PersonsTest {
    @Attributes(["cellphone"])
    @Include({ path: "location", attributes: ["value"], where: { value: option => option.value } })
    @Path("coord")
    coord: Coords;
}

describe("DataFilterRepository", () => {
    let repository: DataFilterRepository<PersonsTest>;

    beforeAll(async () => {
        await databaseFactory();
        repository = new DataFilterRepository(PersonsTest, new DataFilterScanner(), new SequelizeModelScanner());
    });

    it("generateFindOptions should return a valid Sequelize FindOptions object", () => {
        const options = repository.generateFindOptions();
        expect(options).toBeDefined();
        expect(options).toStrictEqual({
            attributes: ["first_name", "last_name"],
            include: [
                {
                    as: "coord",
                    model: Coords,
                    attributes: ["cellphone", "id"],
                    required: false,
                    include: [
                        {
                            as: "location",
                            model: Locations,
                            attributes: ["value", "id"],
                            include: [],
                            required: false
                        }
                    ]
                }
            ]
        });
    });

    it("generateFindOptions with conditions should return a valid Sequelize FindOptions object", () => {
        const options = repository.generateFindOptions({ value: "Montreal" });
        expect(options).toBeDefined();
        expect(options).toStrictEqual({
            attributes: ["first_name", "last_name"],
            include: [
                {
                    as: "coord",
                    model: Coords,
                    attributes: ["cellphone", "id"],
                    required: false,
                    include: [
                        {
                            as: "location",
                            model: Locations,
                            attributes: ["value", "id"],
                            required: false,
                            include: [],
                            where: {
                                value: "Montreal"
                            }
                        }
                    ]
                }
            ]
        });
    });

    it("reduceObject should return a valid PersonsTest object", () => {
        const person = repository.reduceObject({
            first_name: "Test",
            last_name: "Developer",
            coord: {
                cellphone: "11111111111",
                location: {
                    value: "Montreal"
                }
            }
        });
        expect(person).toBeDefined();

        const res = new PersonsTest();
        Object.assign(res, {
            first_name: "Test",
            last_name: "Developer",
            coord: {
                cellphone: "11111111111",
                location: {
                    value: "Montreal"
                }
            }
        });
        expect(person).toStrictEqual(res);
    });
});

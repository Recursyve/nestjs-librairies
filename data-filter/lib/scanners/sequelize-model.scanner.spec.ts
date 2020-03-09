import { SequelizeModelScanner } from "./sequelize-model.scanner";
import { Systems } from "../test/models/systems/systems.model";
import { Places } from "../test/models/places/places.model";
import { Owners } from "../test/models/places/owners.model";
import { Persons } from "../test/models/persons/persons.model";
import { Coords } from "../test/models/coords/coords.model";
import { ContractSystems } from "../test/models/contracts/contract-systems.model";
import { Contracts } from "../test/models/contracts/contracts.model";
import { Invoices } from "../test/models/invoices/invoices.model";

describe("SequelizeModelScanner", () => {
    let scanner: SequelizeModelScanner;

    beforeEach(() => {
        scanner = new SequelizeModelScanner();
    });

    it("getIncludes should returns a valid IncludeOptions array", () => {
        const includes = scanner.getIncludes(Places, { path: "systems.contracts.contract.invoice" }, []);
        expect(includes).toBeDefined();
        expect(includes).toStrictEqual([
            {
                as: "systems",
                model: Systems,
                required: false,
                include: [
                    {
                        as: "contracts",
                        model: ContractSystems,
                        required: false,
                        include: [
                            {
                                as: "contract",
                                model: Contracts,
                                required: false,
                                include: [
                                    {
                                        as: "invoice",
                                        model: Invoices,
                                        required: false,
                                        include: []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]);
    });

    it("getIncludes with additional includes should returns a valid IncludeOptions array", () => {
        const includes = scanner.getIncludes(ContractSystems, { path: "system.place.owners" }, [
            {
                path: "person"
            },
            {
                path: "person.coord"
            }
        ]);
        expect(includes).toBeDefined();
        expect(includes).toStrictEqual([
            {
                as: "system",
                model: Systems,
                required: false,
                include: [
                    {
                        as: "place",
                        model: Places,
                        required: false,
                        include: [
                            {
                                as: "owners",
                                model: Owners,
                                required: false,
                                include: [
                                    {
                                        as: "person",
                                        model: Persons,
                                        required: false,
                                        include: [
                                            {
                                                as: "coord",
                                                model: Coords,
                                                required: false,
                                                include: []
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]);
    });
});

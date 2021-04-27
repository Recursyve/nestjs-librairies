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
                attributes: undefined,
                model: Systems,
                required: false,
                include: [
                    {
                        as: "contracts",
                        attributes: undefined,
                        model: ContractSystems,
                        required: false,
                        include: [
                            {
                                as: "contract",
                                attributes: undefined,
                                model: Contracts,
                                required: false,
                                include: [
                                    {
                                        as: "invoice",
                                        attributes: undefined,
                                        order: undefined,
                                        model: Invoices,
                                        required: false,
                                        separate: false,
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
                attributes: undefined,
                model: Systems,
                required: false,
                include: [
                    {
                        as: "place",
                        attributes: undefined,
                        model: Places,
                        required: false,
                        include: [
                            {
                                as: "owners",
                                attributes: undefined,
                                order: undefined,
                                model: Owners,
                                required: false,
                                separate: false,
                                include: [
                                    {
                                        as: "person",
                                        attributes: undefined,
                                        order: undefined,
                                        model: Persons,
                                        required: false,
                                        separate: false,
                                        include: [
                                            {
                                                as: "coord",
                                                attributes: undefined,
                                                order: undefined,
                                                model: Coords,
                                                required: false,
                                                separate: false,
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

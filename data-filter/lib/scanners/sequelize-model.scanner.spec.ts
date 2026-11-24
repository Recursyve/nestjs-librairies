import { SequelizeModelScanner } from "./sequelize-model.scanner";
import { Systems } from "../test/models/systems/systems.model";
import { Places } from "../test/models/places/places.model";
import { Owners } from "../test/models/places/owners.model";
import { Persons } from "../test/models/persons/persons.model";
import { Coords } from "../test/models/coords/coords.model";
import { ContractSystems } from "../test/models/contracts/contract-systems.model";
import { Contracts } from "../test/models/contracts/contracts.model";
import { Invoices } from "../test/models/invoices/invoices.model";
import { databaseFactory } from "../test/database.factory";

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
                attributes: {
                    include: []
                },
                model: Systems,
                required: false,
                through: undefined,
                include: [
                    {
                        as: "contracts",
                        attributes: {
                            include: []
                        },
                        model: ContractSystems,
                        required: false,
                        through: undefined,
                        include: [
                            {
                                as: "contract",
                                attributes: {
                                    include: []
                                },
                                model: Contracts,
                                required: false,
                                through: undefined,
                                include: [
                                    {
                                        as: "invoice",
                                        attributes: {
                                            include: []
                                        },
                                        order: undefined,
                                        model: Invoices,
                                        required: false,
                                        paranoid: false,
                                        separate: false,
                                        through: undefined,
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

    describe("getOrderColumnLiteral", () => {
        beforeAll(async () => {
            await databaseFactory();
        });

        it("quotes a known column", () => {
            expect(scanner.getOrderColumnLiteral(Persons, { column: "id", direction: "asc" })).toBe("`Persons`.`id`");
        });

        it("quotes a nested association column", () => {
            expect(
                scanner.getOrderColumnLiteral(Persons, { column: "coord.id", direction: "asc" })
            ).toBe("`coord`.`id`");
        });

        it("rejects a quoting breakout in the column name", () => {
            expect(
                scanner.getOrderColumnLiteral(Persons, { column: "id`*(-1),`id", direction: "asc" })
            ).toBeUndefined();
        });

        it("rejects a quoting breakout after an association path", () => {
            expect(
                scanner.getOrderColumnLiteral(Persons, { column: "coord.id`*(-1),`id", direction: "asc" })
            ).toBeUndefined();
        });

        it("rejects an unknown column", () => {
            expect(
                scanner.getOrderColumnLiteral(Persons, { column: "not_a_real_column", direction: "asc" })
            ).toBeUndefined();
        });
    });

    describe("getOrderIncludes", () => {
        it("returns includes for a nested association path", () => {
            const includes = scanner.getOrderIncludes(Persons, { column: "coord.id", direction: "asc" });
            expect(includes).toHaveLength(1);
            expect(includes[0].as).toBe("coord");
        });

        it("does not throw when order.column contains a dotted SQL fragment", () => {
            expect(
                scanner.getOrderIncludes(Persons, {
                    column: "id`*(CASE WHEN (EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='persons')) THEN -1 ELSE 1 END),`id",
                    direction: "asc"
                })
            ).toEqual([]);
        });
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
                attributes: {
                    include: []
                },
                model: Systems,
                required: false,
                through: undefined,
                include: [
                    {
                        as: "place",
                        attributes: {
                            include: []
                        },
                        model: Places,
                        required: false,
                        through: undefined,
                        include: [
                            {
                                as: "owners",
                                attributes: {
                                    include: []
                                },
                                order: undefined,
                                model: Owners,
                                required: false,
                                paranoid: false,
                                separate: false,
                                through: {
                                    attributes: []
                                },
                                include: [
                                    {
                                        as: "person",
                                        attributes: undefined,
                                        order: undefined,
                                        model: Persons,
                                        required: false,
                                        paranoid: false,
                                        separate: false,
                                        through: undefined,
                                        include: [
                                            {
                                                as: "coord",
                                                attributes: {
                                                    include: []
                                                },
                                                order: undefined,
                                                model: Coords,
                                                required: false,
                                                paranoid: false,
                                                separate: false,
                                                through: undefined,
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

import { Injectable } from "@nestjs/common";
import { col, FindOptions, fn, Op, where } from "sequelize";
import { DefaultAccessControlAdapter, DefaultExportAdapter, DefaultTranslateAdapter } from "../adapters";
import { DataFilterService } from "../data-filter.service";
import { Attributes, Data, Include, Path } from "../decorators";
import { DataFilterScanner } from "../scanners/data-filter.scanner";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { ContractSystems } from "../test/models/contracts/contract-systems.model";
import { Contracts } from "../test/models/contracts/contracts.model";
import { Invoices } from "../test/models/invoices/invoices.model";
import { MaintenanceVisits } from "../test/models/maintenance-visits/maintenance-visits.model";
import { Persons } from "../test/models/persons/persons.model";
import { Owners } from "../test/models/places/owners.model";
import { Places } from "../test/models/places/places.model";
import { Systems } from "../test/models/systems/systems.model";
import { Visits } from "../test/models/visits/visits.model";
import { BaseFilter } from "./base-filter";
import { FilterService } from "./filter.service";
import { NumberFilter, TextFilter } from "./filters";
import { DefaultFilter } from "./filters/default.filter";
import { DefaultOrderRule } from "./order-rules/default.order-rule";
import { OrderTiebreakerRule } from "./order-rules/order-tiebreaker.rule";
import { FilterOperatorTypes } from "./operators";
import { databaseFactory } from "../test/database.factory";

@Data(ContractSystems)
@Attributes(["active"])
class ContractSystemsTest {
    @Attributes(["paid", "payment_date", "payment_method"])
    @Path("contract.invoice")
    invoice?: Invoices;

    @Attributes(["start_date", "end_date"])
    @Path("contract")
    contract?: Contracts;

    @Attributes([])
    @Path("system.place.owners")
    @Include("person", { attributes: ["email"] })
    owners?: Owners[];
}

@Injectable()
export class TestFilter extends BaseFilter<ContractSystemsTest> {
    public dataDefinition = ContractSystemsTest;

    public defaultFilter = new DefaultFilter({
        id: "email",
        operation: FilterOperatorTypes.Contains,
        value: "@"
    });

    public email = new TextFilter({
        attribute: "email",
        path: "system.place.owners.person",
        group: "owner"
    }).addOperators({
        name: "none",
        having: where(fn("count", col("system.place.owners.person.email")), {
            [Op.lte]: 0
        })
    });

    public name = new TextFilter({
        attribute: "first_name",
        path: "system.place.owners.person",
        group: "owner",
        condition: {
            condition: "and",
            rules: [
                {
                    path: "system.place.owners.person",
                    key: "last_name",
                    value: "Doe",
                    operation: FilterOperatorTypes.Equal
                }
            ]
        }
    });

    public nestedName = new TextFilter({
        attribute: "first_name",
        path: "system.place.owners.person",
        group: "owner",
        condition: {
            condition: "and",
            rules: [
                {
                    condition: "and",
                    rules: [
                        {
                            path: "system.place.owners.person",
                            key: "last_name",
                            value: "Doe",
                            operation: FilterOperatorTypes.Equal
                        }
                    ]
                }
            ]
        }
    });

    public visitCount = new NumberFilter({
        attribute: "id",
        path: "visits.visit",
        group: "visit",
        having: fn("count", col("visits.visit.id"))
    });

    public contractWithCallback = new TextFilter({
        attribute: "id",
        path: "contract",
        group: "contract",
        where: ({ request, user }) => ({
            status: () => "active",
            tenant_id: () => (request as any).tenantId
        })
    });
}

describe("FilterService", () => {
    let filterService: FilterService<ContractSystemsTest>;

    beforeAll(() => {
        filterService = new FilterService<ContractSystemsTest>(
            new DefaultAccessControlAdapter(),
            new DefaultTranslateAdapter(),
            new TestFilter(),
            new SequelizeModelScanner(),
            new DataFilterService(
                new DataFilterScanner(),
                new SequelizeModelScanner(),
                new DefaultAccessControlAdapter(),
                new DefaultTranslateAdapter(),
                new DefaultExportAdapter()
            )
        );
    });

    it("getFindOptions should return a valid Sequelize FindOptions", async () => {
        const request = {};
        const user = null;

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
        }, request, user);
        expect(options).toBeDefined();
        expect(options).toStrictEqual({
            include: [
                {
                    as: "system",
                    model: Systems,
                    required: false,
                    paranoid: true,
                    attributes: [],
                    through: undefined,
                    include: [
                        {
                            as: "place",
                            model: Places,
                            required: false,
                            paranoid: true,
                            attributes: [],
                            through: undefined,
                            include: [
                                {
                                    as: "owners",
                                    model: Owners,
                                    required: false,
                                    paranoid: true,
                                    attributes: [],
                                    through: {
                                        attributes: []
                                    },
                                    include: [
                                        {
                                            as: "person",
                                            model: Persons,
                                            order: undefined,
                                            required: false,
                                            separate: false,
                                            paranoid: false,
                                            attributes: [],
                                            through: undefined,
                                            include: []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    as: "visits",
                    model: MaintenanceVisits,
                    required: false,
                    attributes: [],
                    through: undefined,
                    include: [
                        {
                            as: "visit",
                            model: Visits,
                            order: undefined,
                            required: false,
                            paranoid: true,
                            separate: false,
                            attributes: [],
                            through: undefined,
                            include: []
                        }
                    ]
                }
            ],
            where: {
                [Op.and]: [
                    {
                        [Op.and]: [
                            {
                                "$system.place.owners.person.first_name$": "John"
                            },
                            {
                                "$system.place.owners.person.last_name$": "Doe"
                            }
                        ]
                    },
                    {
                        "$system.place.owners.person.email$": {
                            [Op.like]: "%@%"
                        }
                    }
                ]
            },
            having: {
                [Op.and]: [
                    where(fn("count", col("system.place.owners.person.email")), {
                        [Op.lte]: 0
                    }),
                    where(fn("count", col("visits.visit.id")), {
                        [Op.gte]: 2
                    })
                ]
            }
        } as FindOptions);
    });

    it("getFindOptions should walk nested filter.condition groups without overflowing", async () => {
        const options = await filterService.getFindOptions(ContractSystems, {
            condition: "and",
            rules: [
                {
                    id: "nestedName",
                    value: "John",
                    operation: FilterOperatorTypes.Equal
                }
            ]
        }, {}, null);

        expect(options.include).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    as: "system"
                })
            ])
        );
        expect(options.where).toEqual(
            expect.objectContaining({
                [Op.and]: expect.arrayContaining([
                    {
                        [Op.and]: [
                            {
                                "$system.place.owners.person.first_name$": "John"
                            },
                            {
                                [Op.and]: [
                                    {
                                        "$system.place.owners.person.last_name$": "Doe"
                                    }
                                ]
                            }
                        ]
                    }
                ])
            })
        );
    });

    it("getFindOptions should handle filter with where callback", async () => {
        const testRequest = { tenantId: 123 };
        const testUser = { id: 1, language: "en" } as any;
        
        const options = await filterService.getFindOptions(ContractSystems, {
            condition: "and",
            rules: [
                {
                    id: "contractWithCallback",
                    value: "test",
                    operation: FilterOperatorTypes.Equal
                }
            ]
        }, testRequest, testUser);
        
        expect(options).toStrictEqual<FindOptions>({
            include: [
                {
                    as: "contract",
                    model: Contracts,
                    required: false,
                    paranoid: true,
                    attributes: [],
                    include: [],
                    order: undefined,
                    separate: false,
                    through: undefined,
                    where: {
                        status: "active",
                        tenant_id: 123
                    }
                },
                {
                    as: "system",
                    model: Systems,
                    required: false,
                    attributes: [],
                    through: undefined,
                    include: [
                        {
                            as: "place",
                            model: Places,
                            required: false,
                            attributes: [],
                            through: undefined,
                            include: [
                                {
                                    as: "owners",
                                    model: Owners,
                                    required: false,
                                    attributes: [],
                                    through: {
                                        attributes: []
                                    },
                                    include: [
                                        {
                                            as: "person",
                                            model: Persons,
                                            order: undefined,
                                            required: false,
                                            separate: false,
                                            paranoid: true,
                                            attributes: [],
                                            through: undefined,
                                            include: []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            where: {
                [Op.and]: [
                    {
                        "$contract.id$": "test"
                    },
                    {
                        "$system.place.owners.person.email$": {
                            [Op.like]: "%@%"
                        }
                    }
                ]
            }
        });
    });
});

@Injectable()
export class OrderByDistinctTestFilter extends BaseFilter<ContractSystemsTest> {
    public dataDefinition = ContractSystemsTest;

    public defaultOrderRule = new DefaultOrderRule({ column: "active", direction: "desc" });
}

describe("FilterService resolveOrderColumns", () => {
    let filterService: FilterService<ContractSystemsTest>;

    beforeAll(() => {
        filterService = new FilterService<ContractSystemsTest>(
            new DefaultAccessControlAdapter(),
            new DefaultTranslateAdapter(),
            new OrderByDistinctTestFilter(),
            new SequelizeModelScanner(),
            new DataFilterService(
                new DataFilterScanner(),
                new SequelizeModelScanner(),
                new DefaultAccessControlAdapter(),
                new DefaultTranslateAdapter(),
                new DefaultExportAdapter()
            )
        );
    });

    it("merges defaultOrderRule when client order is empty", () => {
        const service = filterService as unknown as {
            resolveOrderColumns: (
                orders: Array<{ column: string; direction: string }>
            ) => Array<{ column: string; direction: string }>;
        };

        expect(service.resolveOrderColumns([])).toEqual([{ column: "active", direction: "desc" }]);
    });

    it("prefers explicit client order over defaultOrderRule for the same column", () => {
        const service = filterService as unknown as {
            resolveOrderColumns: (
                orders: Array<{ column: string; direction: string }>
            ) => Array<{ column: string; direction: string }>;
        };

        expect(service.resolveOrderColumns([{ column: "active", direction: "asc" }])).toEqual([
            { column: "active", direction: "asc" }
        ]);
    });
});

@Injectable()
export class OrderTiebreakerTestFilter extends BaseFilter<ContractSystemsTest> {
    public dataDefinition = ContractSystemsTest;

    public orderTiebreakerRule = new OrderTiebreakerRule({ column: "id" });
}

describe("FilterService orderTiebreakerRule", () => {
    let filterService: FilterService<ContractSystemsTest>;

    beforeAll(() => {
        filterService = new FilterService<ContractSystemsTest>(
            new DefaultAccessControlAdapter(),
            new DefaultTranslateAdapter(),
            new OrderTiebreakerTestFilter(),
            new SequelizeModelScanner(),
            new DataFilterService(
                new DataFilterScanner(),
                new SequelizeModelScanner(),
                new DefaultAccessControlAdapter(),
                new DefaultTranslateAdapter(),
                new DefaultExportAdapter()
            )
        );
    });

    it("appends the tiebreaker after the user order", () => {
        const service = filterService as unknown as {
            resolveOrderColumns: (
                orders: Array<{ column: string; direction: string }>
            ) => Array<{ column: string; direction: string }>;
        };

        expect(service.resolveOrderColumns([{ column: "name", direction: "desc" }])).toEqual([
            { column: "name", direction: "desc" },
            { column: "id", direction: "desc" }
        ]);
    });

    it("inherits the last effective direction when the tiebreaker omits direction", () => {
        const service = filterService as unknown as {
            resolveOrderColumns: (
                orders: Array<{ column: string; direction: string }>
            ) => Array<{ column: string; direction: string }>;
        };

        expect(
            service.resolveOrderColumns([
                { column: "status", direction: "asc" },
                { column: "name", direction: "desc" }
            ])
        ).toEqual([
            { column: "status", direction: "asc" },
            { column: "name", direction: "desc" },
            { column: "id", direction: "desc" }
        ]);
    });

    it("defaults to id ASC when there is no order", () => {
        const service = filterService as unknown as {
            resolveOrderColumns: (
                orders: Array<{ column: string; direction: string }>
            ) => Array<{ column: string; direction: string }>;
        };

        expect(service.resolveOrderColumns([])).toEqual([{ column: "id", direction: "asc" }]);
    });

    it("does not duplicate id when the user already ordered by it", () => {
        const service = filterService as unknown as {
            resolveOrderColumns: (
                orders: Array<{ column: string; direction: string }>
            ) => Array<{ column: string; direction: string }>;
        };

        expect(service.resolveOrderColumns([{ column: "id", direction: "desc" }])).toEqual([
            { column: "id", direction: "desc" }
        ]);
    });

    it("does not append the tiebreaker when groupBy is set", () => {
        const service = filterService as unknown as {
            resolveOrderColumns: (
                orders: Array<{ column: string; direction: string }>,
                groupBy?: string
            ) => Array<{ column: string; direction: string }>;
        };

        expect(service.resolveOrderColumns([{ column: "name", direction: "desc" }], "status")).toEqual([
            { column: "name", direction: "desc" }
        ]);
        expect(service.resolveOrderColumns([], "status")).toEqual([]);
    });
});

@Injectable()
export class CombinedOrderRulesTestFilter extends BaseFilter<ContractSystemsTest> {
    public dataDefinition = ContractSystemsTest;

    public defaultOrderRule = new DefaultOrderRule({ column: "active", direction: "desc" });
    public orderTiebreakerRule = new OrderTiebreakerRule({ column: "id" });
}

describe("FilterService defaultOrderRule and orderTiebreakerRule", () => {
    let filterService: FilterService<ContractSystemsTest>;

    beforeAll(async () => {
        await databaseFactory();
        filterService = new FilterService<ContractSystemsTest>(
            new DefaultAccessControlAdapter(),
            new DefaultTranslateAdapter(),
            new CombinedOrderRulesTestFilter(),
            new SequelizeModelScanner(),
            new DataFilterService(
                new DataFilterScanner(),
                new SequelizeModelScanner(),
                new DefaultAccessControlAdapter(),
                new DefaultTranslateAdapter(),
                new DefaultExportAdapter()
            )
        );
    });

    it("prepends defaultOrderRule and still appends the tiebreaker", () => {
        const service = filterService as unknown as {
            resolveOrderColumns: (
                orders: Array<{ column: string; direction: string }>
            ) => Array<{ column: string; direction: string }>;
        };

        expect(service.resolveOrderColumns([{ column: "name", direction: "asc" }])).toEqual([
            { column: "active", direction: "desc" },
            { column: "name", direction: "asc" },
            { column: "id", direction: "asc" }
        ]);
    });

    it("uses the same resolved order for filter and downloadData", () => {
        const service = filterService as unknown as {
            resolveOrderColumns: (
                orders: Array<{ column: string; direction: string }>
            ) => Array<{ column: string; direction: string }>;
            getOrderOptions: (
                orders: Array<{ column: string; direction: string }>,
                context: object
            ) => unknown[];
        };
        const orders = [{ column: "name", direction: "desc" }];
        const resolved = service.resolveOrderColumns(orders);

        expect(resolved).toEqual([
            { column: "active", direction: "desc" },
            { column: "name", direction: "desc" },
            { column: "id", direction: "desc" }
        ]);
        expect(service.getOrderOptions(orders, {})).toHaveLength(resolved.length);
    });
});

@Injectable()
export class OrderTiebreakerSelectTestFilter extends BaseFilter<ContractSystemsTest> {
    public dataDefinition = ContractSystemsTest;

    public orderTiebreakerRule = new OrderTiebreakerRule([{ column: "active" }, { column: "id" }]);
}

describe("FilterService orderTiebreakerRule select attributes", () => {
    let filterService: FilterService<ContractSystemsTest>;

    beforeAll(async () => {
        await databaseFactory();
        filterService = new FilterService<ContractSystemsTest>(
            new DefaultAccessControlAdapter(),
            new DefaultTranslateAdapter(),
            new OrderTiebreakerSelectTestFilter(),
            new SequelizeModelScanner(),
            new DataFilterService(
                new DataFilterScanner(),
                new SequelizeModelScanner(),
                new DefaultAccessControlAdapter(),
                new DefaultTranslateAdapter(),
                new DefaultExportAdapter()
            )
        );
    });

    it("selects non-id tiebreaker columns for the DISTINCT page query and skips id", () => {
        const service = filterService as unknown as {
            getOrderSelectAttributes: (
                orders: Array<{ column: string; direction: string }>,
                context: object
            ) => Array<[unknown, string]>;
        };

        const attributes = service.getOrderSelectAttributes([{ column: "name", direction: "desc" }], {});
        const aliases = attributes.map((attribute) => attribute[1]);

        expect(aliases).toContain("name");
        expect(aliases).toContain("active");
        expect(aliases).not.toContain("id");
    });
});

import { Injectable } from "@nestjs/common";
import { col, FindOptions, fn, Op, where } from "sequelize";
import { DefaultAccessControlAdapter, DefaultExportAdapter, DefaultTranslateAdapter } from "../adapters";
import { Attributes, Data, Include, Path } from "../decorators";
import { ContractSystems } from "../test/models/contracts/contract-systems.model";
import { Invoices } from "../test/models/invoices/invoices.model";
import { Contracts } from "../test/models/contracts/contracts.model";
import { Owners } from "../test/models/places/owners.model";
import { BaseFilter } from "./base-filter";
import { NumberFilter, TextFilter } from "./filters";
import { FilterOperatorTypes } from "./operators";
import { FilterService } from "./filter.service";
import { SequelizeModelScanner } from "../scanners/sequelize-model.scanner";
import { DataFilterService } from "../data-filter.service";
import { DataFilterScanner } from "../scanners/data-filter.scanner";
import { Systems } from "../test/models/systems/systems.model";
import { Places } from "../test/models/places/places.model";
import { Persons } from "../test/models/persons/persons.model";
import { MaintenanceVisits } from "../test/models/maintenance-visits/maintenance-visits.model";
import { Visits } from "../test/models/visits/visits.model";

@Data(ContractSystems)
@Attributes(["active"])
class ContractSystemsTest {
    @Attributes(["paid", "payment_date", "payment_method"])
    @Path("contract.invoice")
    invoice: Invoices;

    @Attributes(["start_date", "end_date"])
    @Path("contract")
    contract: Contracts;

    @Attributes([])
    @Path("system.place.owners")
    @Include({ path: "person", attributes: ["email"] })
    owners: Owners[];
}

@Injectable()
export class TestFilter extends BaseFilter<ContractSystemsTest> {
    public dataDefinition = ContractSystemsTest;

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

    public visitCount = new NumberFilter({
        attribute: "id",
        path: "visits.visit",
        group: "visit",
        having: fn("count", col("visits.visit.id"))
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
        expect(options).toStrictEqual({
            group: "ContractSystems.id",
            include: [
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
                    include: [
                        {
                            as: "visit",
                            model: Visits,
                            required: false,
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
});

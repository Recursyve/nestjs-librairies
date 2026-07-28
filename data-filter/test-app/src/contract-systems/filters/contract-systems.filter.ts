import { Injectable } from "@nestjs/common";
import {
    Attributes,
    BaseFilter,
    Data,
    DateFilter,
    FilterOperatorTypes,
    Include,
    NumberFilter,
    Path,
    RadioFilter,
    SelectFilter,
    SelectFilterValue,
    TextFilter
} from "@recursyve/nestjs-data-filter";
import { col, fn, Op, where } from "sequelize";
import { Contracts } from "../../contracts/models/contracts.model";
import { Invoices } from "../../invoices/models/invoices.model";
import { Owners } from "../../owners/models/owners.model";
import { Systems } from "../../systems/models/systems.model";
import { ContractSystems } from "../models/contract-systems.model";

@Data(ContractSystems)
@Attributes(["active"])
export class ContractSystemsData {
    @Attributes(["paid", "invoice_number"])
    @Path("contract.invoice")
    invoice?: Invoices;

    @Attributes(["start_date", "end_date", "total_cost"])
    @Path("contract")
    contract?: Contracts;

    @Attributes([])
    @Path("system.place.owners")
    @Include("person", { attributes: ["email", "first_name", "last_name"] })
    owners?: Owners[];

    @Attributes(["file_number"])
    @Path("system")
    system?: Systems;
}

@Injectable()
export class ContractSystemsFilter extends BaseFilter<ContractSystemsData> {
    public readonly dataDefinition = ContractSystemsData;

    public readonly active = new RadioFilter({
        attribute: "active",
        options: [
            { key: "yes", value: true },
            { key: "no", value: false }
        ]
    });

    public readonly ownerEmail = new TextFilter({
        attribute: "email",
        path: "system.place.owners.person",
        group: "owner"
    }).addOperators({
        name: "none",
        having: where(fn("count", col("system.place.owners.person.email")), {
            [Op.lte]: 0
        })
    });

    public readonly ownerFirstName = new TextFilter({
        attribute: "first_name",
        path: "system.place.owners.person",
        group: "owner",
        condition: {
            condition: "and",
            rules: [
                {
                    path: "system.place.owners.person",
                    key: "last_name",
                    value: "Alpha",
                    operation: FilterOperatorTypes.Equal
                }
            ]
        }
    });

    public readonly visitCount = new NumberFilter({
        attribute: "id",
        path: "visits.visit",
        group: "visit",
        having: fn("count", col("visits.visit.id"))
    });

    public readonly contractStart = new DateFilter({
        attribute: "start_date",
        path: "contract"
    });

    public readonly scopedContractCost = new TextFilter({
        attribute: "total_cost",
        path: "contract",
        where: ({ request }) => ({
            total_cost: () => (request as { minCost?: number }).minCost
        })
    });

    public readonly invoicePaid = new RadioFilter({
        attribute: "paid",
        path: "contract.invoice",
        options: [
            { key: "paid", value: true },
            { key: "unpaid", value: false }
        ]
    });

    public readonly systemFileNumber = new TextFilter({
        attribute: "file_number",
        path: "system"
    });

    public readonly statusSelect = new SelectFilter({
        attribute: "type",
        path: "visits.visit",
        lazyLoading: false,
        values: async (): Promise<SelectFilterValue[]> =>
            Promise.resolve([
                { id: "inspection", name: "Inspection" },
                { id: "repair", name: "Repair" }
            ]),
        getResourceById: async ({ id }) => {
            const values: SelectFilterValue[] = await Promise.resolve([
                { id: "inspection", name: "Inspection" },
                { id: "repair", name: "Repair" }
            ]);

            return values.find((value) => value.id === id) ?? null;
        }
    });
}

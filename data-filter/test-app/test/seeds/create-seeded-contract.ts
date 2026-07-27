import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { Contracts } from "../../src/contracts/models/contracts.model";
import { Seeded } from "./seeded.type";

type CreateSeededContractParams = {
    end_date: string;
    invoice_id: number;
    payable_by: string;
    start_date: string;
    total_cost: number;
};

type SeededContract = Seeded<{
    id: number;
    end_date: string;
    invoice_id: number;
    payable_by: string;
    start_date: string;
    total_cost: number;
}>;

function toDateOnlyString(value: Date | string): string {
    if (typeof value === "string") {
        return value;
    }

    return value.toISOString().slice(0, 10);
}

export async function createSeededContract(params: CreateSeededContractParams): Promise<SeededContract> {
    const row = await Contracts.create(params);
    if (!arePropertiesDefined(row, "id", "end_date", "invoice_id", "payable_by", "start_date", "total_cost")) {
        throw new Error("Failed to seed contract");
    }

    return {
        id: row.id,
        end_date: toDateOnlyString(row.end_date),
        invoice_id: row.invoice_id,
        payable_by: toDateOnlyString(row.payable_by),
        start_date: toDateOnlyString(row.start_date),
        total_cost: row.total_cost,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

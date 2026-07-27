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

export async function createSeededContract(params: CreateSeededContractParams): Promise<SeededContract> {
    const row = await Contracts.create(params);
    if (!arePropertiesDefined(row, "id", "end_date", "invoice_id", "payable_by", "start_date", "total_cost")) {
        throw new Error("Failed to seed contract");
    }

    return {
        id: row.id,
        end_date: row.end_date.toISOString(),
        invoice_id: row.invoice_id,
        payable_by: row.payable_by.toISOString(),
        start_date: row.start_date.toISOString(),
        total_cost: row.total_cost,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

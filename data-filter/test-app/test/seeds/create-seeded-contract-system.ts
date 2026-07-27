import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { ContractSystems } from "../../src/contract-systems/models/contract-systems.model";
import { Seeded } from "./seeded.type";

type CreateSeededContractSystemParams = {
    activated_date: string;
    active: boolean;
    contract_id: number;
    system_id: number;
};

type SeededContractSystem = Seeded<{
    id: number;
    activated_date: string;
    active: boolean;
    contract_id: number;
    system_id: number;
}>;

export async function createSeededContractSystem(
    params: CreateSeededContractSystemParams
): Promise<SeededContractSystem> {
    const row = await ContractSystems.create(params);
    if (!arePropertiesDefined(row, "id", "activated_date", "active", "contract_id", "system_id")) {
        throw new Error("Failed to seed contract system");
    }

    return {
        id: row.id,
        activated_date: row.activated_date,
        active: row.active,
        contract_id: row.contract_id,
        system_id: row.system_id,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

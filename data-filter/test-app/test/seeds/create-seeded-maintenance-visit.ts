import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { MaintenanceVisits } from "../../src/maintenance-visits/models/maintenance-visits.model";
import { Seeded } from "./seeded.type";

type CreateSeededMaintenanceVisitParams = {
    contract_system_id: number;
    visit_id: number;
};

type SeededMaintenanceVisit = Seeded<{
    id: number;
    contract_system_id: number;
    visit_id: number;
}>;

export async function createSeededMaintenanceVisit(
    params: CreateSeededMaintenanceVisitParams
): Promise<SeededMaintenanceVisit> {
    const row = await MaintenanceVisits.create(params);
    if (!arePropertiesDefined(row, "id", "contract_system_id", "visit_id")) {
        throw new Error("Failed to seed maintenance visit");
    }

    return {
        id: row.id,
        contract_system_id: row.contract_system_id,
        visit_id: row.visit_id,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

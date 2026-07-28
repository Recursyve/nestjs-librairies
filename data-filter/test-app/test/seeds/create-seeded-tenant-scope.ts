import { arePropertiesDefined } from "@recursyve/nice-ts-utils";
import { TenantScopes } from "../../src/tenant-scopes/models/tenant-scopes.model";
import { Seeded } from "./seeded.type";

type CreateSeededTenantScopeParams = {
    label: string;
    tenant_id: number;
};

type SeededTenantScope = Seeded<{
    id: number;
    label: string;
    tenant_id: number;
}>;

export async function createSeededTenantScope(params: CreateSeededTenantScopeParams): Promise<SeededTenantScope> {
    const row = await TenantScopes.create(params);
    if (!arePropertiesDefined(row, "id", "label", "tenant_id")) {
        throw new Error("Failed to seed tenant scope");
    }

    return {
        id: row.id,
        label: row.label,
        tenant_id: row.tenant_id,
        async [Symbol.asyncDispose]() {
            await row.destroy({ force: true });
        }
    };
}

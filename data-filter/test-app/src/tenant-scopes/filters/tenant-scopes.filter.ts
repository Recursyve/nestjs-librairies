import { Injectable } from "@nestjs/common";
import { Attributes, BaseFilter, Data, FilterOperatorTypes, TextFilter } from "@recursyve/nestjs-data-filter";
import { TenantScopes } from "../models/tenant-scopes.model";

@Data(TenantScopes)
@Attributes(["tenant_id", "label"])
export class TenantScopesData {}

@Injectable()
export class TenantScopesFilter extends BaseFilter<TenantScopesData> {
    public readonly dataDefinition = TenantScopesData;

    public readonly label = new TextFilter({ attribute: "label" });

    public readonly tenantLabel = new TextFilter({
        attribute: "label",
        where: ({ request }) => ({
            tenant_id: () => (request as { tenantId?: number }).tenantId
        })
    });

    public readonly categoryScoped = new TextFilter({
        attribute: "label",
        condition: {
            condition: "and",
            rules: [
                {
                    key: "tenant_id",
                    value: 7,
                    operation: FilterOperatorTypes.Equal
                }
            ]
        }
    });
}

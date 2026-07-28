import { Controller } from "@nestjs/common";
import { FilterController, FilterService, InjectFilter } from "@recursyve/nestjs-data-filter";
import { TenantScopesData, TenantScopesFilter } from "../filters/tenant-scopes.filter";

@Controller("tenant-scopes")
export class TenantScopesController extends FilterController<TenantScopesData> {
    constructor(@InjectFilter(TenantScopesFilter) filterService: FilterService<TenantScopesData>) {
        super(filterService);
    }
}

import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { TenantScopesController } from "./controllers/tenant-scopes.controller";
import { TenantScopesFilter } from "./filters/tenant-scopes.filter";
import { TenantScopes } from "./models/tenant-scopes.model";

@Module({
    imports: [
        SequelizeModule.forFeature([TenantScopes]),
        DataFilterModule.forFeature({
            filters: [{ filter: TenantScopesFilter }]
        })
    ],
    controllers: [TenantScopesController]
})
export class TenantScopesModule {}

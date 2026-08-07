import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import {
    AccessControlAdapter,
    DataFilterModule,
    TranslateAdapter,
    UserDeserializer
} from "@recursyve/nestjs-data-filter";
import { NextFunction, Request, Response } from "express";
import { ArchiveItemsModule } from "./archive-items/archive-items.module";
import { ArtifactsModule } from "./artifacts/artifacts.module";
import { CargoBillsModule } from "./cargo-bills/cargo-bills.module";
import { CatalogItemsModule } from "./catalog-items/catalog-items.module";
import { ConfigLabItemsModule } from "./config-lab/config-lab-items.module";
import { ContractSystemsModule } from "./contract-systems/contract-systems.module";
import { ContractsModule } from "./contracts/contracts.module";
import { CoordsModule } from "./coords/coords.module";
import { CountLabModule } from "./count-lab/count-lab.module";
import { EditionsModule } from "./editions/editions.module";
import { ExportLabModule } from "./export-lab/export-lab.module";
import { FilterLabModule } from "./filter-lab/filter-lab.module";
import { GroupLabModule } from "./group-lab/group-lab.module";
import { GuildChartersModule } from "./guild-charters/guild-charters.module";
import { HarborNoticesModule } from "./harbor-notices/harbor-notices.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { LocationsModule } from "./locations/locations.module";
import { MaintenanceVisitsModule } from "./maintenance-visits/maintenance-visits.module";
import { MarketListingsModule } from "./market-listings/market-listings.module";
import { MemberTiersModule } from "./member-tiers/member-tiers.module";
import { MuseumsModule } from "./museums/museums.module";
import { OrderLabModule } from "./order-lab/order-lab.module";
import { OwnersModule } from "./owners/owners.module";
import { PersonsModule } from "./persons/persons.module";
import { PlaceOwnersModule } from "./place-owners/place-owners.module";
import { PlacesModule } from "./places/places.module";
import { PriorityLanesModule } from "./priority-lanes/priority-lanes.module";
import { ProductsModule } from "./products/products.module";
import { ProfileCaptionsModule } from "./profile-captions/profile-captions.module";
import { RawEventsModule } from "./raw-events/raw-events.module";
import { RepositoryProbesModule } from "./repository-probes/repository-probes.module";
import { ResidentAddressesModule } from "./resident-addresses/resident-addresses.module";
import { ResidentsModule } from "./residents/residents.module";
import { SpellScrollsModule } from "./spell-scrolls/spell-scrolls.module";
import { StockLinesModule } from "./stock-lines/stock-lines.module";
import { StoryArcsModule } from "./story-arcs/story-arcs.module";
import { SubscribersModule } from "./subscribers/subscribers.module";
import { SystemsModule } from "./systems/systems.module";
import { TenantScopesModule } from "./tenant-scopes/tenant-scopes.module";
import { TestAccessControlAdapter } from "./test-access-control/test-access-control.adapter";
import { TestUserDeserializer } from "./test-access-control/test-user.deserializer";
import { TestTranslateAdapter } from "./test-translate/test-translate.adapter";
import { TicketTypesModule } from "./ticket-types/ticket-types.module";
import { VisitsModule } from "./visits/visits.module";
import { VoyageManifestsModule } from "./voyage-manifests/voyage-manifests.module";
import { WarehousesModule } from "./warehouses/warehouses.module";

@Module({
    imports: [
        DataFilterModule.forRoot({
            filter: { maxPage: 50 },
            accessControlAdapter: {
                provide: AccessControlAdapter,
                useClass: TestAccessControlAdapter
            },
            translateAdapter: {
                provide: TranslateAdapter,
                useClass: TestTranslateAdapter
            },
            deserializer: {
                provide: UserDeserializer,
                useClass: TestUserDeserializer
            },
            validateData: false
        }),
        SequelizeModule.forRoot({
            dialect: "mysql",
            host: process.env.DB_HOST ?? "localhost",
            port: Number(process.env.DB_PORT ?? 3306),
            username: process.env.DB_USERNAME ?? "root",
            password: process.env.DB_PASSWORD ?? "root",
            database: process.env.DB_NAME ?? "test",
            autoLoadModels: true,
            synchronize: false,
            logging: false,
            define: {
                timestamps: true,
                paranoid: true,
                updatedAt: "updated_at",
                createdAt: "created_at",
                deletedAt: "deleted_at",
                defaultScope: {
                    attributes: {
                        exclude: ["updated_at", "created_at", "deleted_at"]
                    }
                }
            }
        }),
        ArchiveItemsModule,
        ArtifactsModule,
        CargoBillsModule,
        CatalogItemsModule,
        ConfigLabItemsModule,
        ContractSystemsModule,
        ContractsModule,
        CoordsModule,
        CountLabModule,
        EditionsModule,
        ExportLabModule,
        FilterLabModule,
        GroupLabModule,
        GuildChartersModule,
        HarborNoticesModule,
        InvoicesModule,
        LocationsModule,
        MaintenanceVisitsModule,
        MarketListingsModule,
        MemberTiersModule,
        MuseumsModule,
        OrderLabModule,
        OwnersModule,
        PersonsModule,
        PlaceOwnersModule,
        PlacesModule,
        PriorityLanesModule,
        ProductsModule,
        ProfileCaptionsModule,
        RawEventsModule,
        RepositoryProbesModule,
        ResidentAddressesModule,
        ResidentsModule,
        SpellScrollsModule,
        StockLinesModule,
        StoryArcsModule,
        SubscribersModule,
        SystemsModule,
        TenantScopesModule,
        TicketTypesModule,
        VisitsModule,
        VoyageManifestsModule,
        WarehousesModule
    ],
    controllers: [],
    providers: []
})
export class AppModule implements NestModule {
    public configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply((req: Request, _: Response, next: NextFunction) => {
                const tenantHeader = req.header("x-tenant-id");
                if (tenantHeader !== undefined) {
                    req.tenantId = Number(tenantHeader);
                }

                next();
            })
            .forRoutes("*");
    }
}

import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AccessControlAdapter, DataFilterModule, UserDeserializer } from "@recursyve/nestjs-data-filter";
import { CatalogItemsModule } from "./catalog-items/catalog-items.module";
import { ContractSystemsModule } from "./contract-systems/contract-systems.module";
import { ContractsModule } from "./contracts/contracts.module";
import { CoordsModule } from "./coords/coords.module";
import { EditionsModule } from "./editions/editions.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { LocationsModule } from "./locations/locations.module";
import { MaintenanceVisitsModule } from "./maintenance-visits/maintenance-visits.module";
import { MarketListingsModule } from "./market-listings/market-listings.module";
import { MemberTiersModule } from "./member-tiers/member-tiers.module";
import { OwnersModule } from "./owners/owners.module";
import { PersonsModule } from "./persons/persons.module";
import { PlaceOwnersModule } from "./place-owners/place-owners.module";
import { PlacesModule } from "./places/places.module";
import { PriorityLanesModule } from "./priority-lanes/priority-lanes.module";
import { ProductsModule } from "./products/products.module";
import { ProfileCaptionsModule } from "./profile-captions/profile-captions.module";
import { RawEventsModule } from "./raw-events/raw-events.module";
import { ResidentAddressesModule } from "./resident-addresses/resident-addresses.module";
import { ResidentsModule } from "./residents/residents.module";
import { StoryArcsModule } from "./story-arcs/story-arcs.module";
import { SubscribersModule } from "./subscribers/subscribers.module";
import { SystemsModule } from "./systems/systems.module";
import { TestAccessControlAdapter } from "./test-access-control/test-access-control.adapter";
import { TestUserDeserializer } from "./test-access-control/test-user.deserializer";
import { TicketTypesModule } from "./ticket-types/ticket-types.module";
import { VisitsModule } from "./visits/visits.module";

@Module({
    imports: [
        DataFilterModule.forRoot({
            filter: { maxPage: 50 },
            accessControlAdapter: {
                provide: AccessControlAdapter,
                useClass: TestAccessControlAdapter
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
        CatalogItemsModule,
        ContractSystemsModule,
        ContractsModule,
        CoordsModule,
        EditionsModule,
        InvoicesModule,
        LocationsModule,
        MaintenanceVisitsModule,
        MarketListingsModule,
        MemberTiersModule,
        OwnersModule,
        PersonsModule,
        PlaceOwnersModule,
        PlacesModule,
        PriorityLanesModule,
        ProductsModule,
        ProfileCaptionsModule,
        RawEventsModule,
        ResidentAddressesModule,
        ResidentsModule,
        StoryArcsModule,
        SubscribersModule,
        SystemsModule,
        TicketTypesModule,
        VisitsModule
    ],
    controllers: [],
    providers: []
})
export class AppModule {}

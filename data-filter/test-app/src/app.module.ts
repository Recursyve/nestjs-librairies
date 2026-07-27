import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { AccessControlAdapter, DataFilterModule, UserDeserializer } from "@recursyve/nestjs-data-filter";
import { ContractSystemsModule } from "./contract-systems/contract-systems.module";
import { ContractsModule } from "./contracts/contracts.module";
import { CoordsModule } from "./coords/coords.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { LocationsModule } from "./locations/locations.module";
import { MaintenanceVisitsModule } from "./maintenance-visits/maintenance-visits.module";
import { OwnersModule } from "./owners/owners.module";
import { PersonsModule } from "./persons/persons.module";
import { PlaceOwnersModule } from "./place-owners/place-owners.module";
import { PlacesModule } from "./places/places.module";
import { ProductsModule } from "./products/products.module";
import { SystemsModule } from "./systems/systems.module";
import { TestAccessControlAdapter } from "./test-access-control/test-access-control.adapter";
import { TestUserDeserializer } from "./test-access-control/test-user.deserializer";
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
        ContractSystemsModule,
        ContractsModule,
        CoordsModule,
        InvoicesModule,
        LocationsModule,
        MaintenanceVisitsModule,
        OwnersModule,
        PersonsModule,
        PlaceOwnersModule,
        PlacesModule,
        ProductsModule,
        SystemsModule,
        VisitsModule
    ],
    controllers: [],
    providers: []
})
export class AppModule {}

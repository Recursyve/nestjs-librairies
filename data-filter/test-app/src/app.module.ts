import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
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
import { VisitsModule } from "./visits/visits.module";

@Module({
    imports: [
        SequelizeModule.forRoot({
            dialect: "mysql",
            host: "localhost",
            port: 3306,
            username: "root",
            password: "root",
            database: "test"
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

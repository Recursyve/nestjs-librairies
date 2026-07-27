import { Module } from "@nestjs/common";
import { ContractsModule } from "./contracts/contracts.module";
import { CoordsModule } from "./coords/coords.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { LocationsModule } from "./locations/locations.module";
import { PersonsModule } from "./persons/persons.module";
import { PlaceOwnersModule } from "./place-owners/place-owners.module";
import { PlacesModule } from "./places/places.module";
import { ProductsModule } from "./products/products.module";
import { SystemsModule } from "./systems/systems.module";
import { VisitsModule } from "./visits/visits.module";

@Module({
    imports: [
        ContractsModule,
        CoordsModule,
        InvoicesModule,
        LocationsModule,
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

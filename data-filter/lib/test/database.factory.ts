import { Sequelize } from "sequelize-typescript";

import { ContractSystems } from "./models/contracts/contract-systems.model";
import { Contracts } from "./models/contracts/contracts.model";
import { Coords } from "./models/coords/coords.model";
import { Invoices } from "./models/invoices/invoices.model";
import { Locations } from "./models/locations/locations.model";
import { MaintenanceVisits } from "./models/maintenance-visits/maintenance-visits.model";
import { Persons } from "./models/persons/persons.model";
import { Owners } from "./models/places/owners.model";
import { PlaceOwners } from "./models/places/place-owners.model";
import { Places } from "./models/places/places.model";
import { Systems } from "./models/systems/systems.model";
import { Visits } from "./models/visits/visits.model";

let sync = false;
let sequelize: Sequelize;

export async function databaseFactory(): Promise<Sequelize> {
    if (sync) {
        return sequelize;
    }

    sequelize = new Sequelize({
        dialect: "sqlite",
        storage: ":memory:",
        database: "test_db",
        username: "root",
        password: "",
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
        },
        models: [
            Contracts,
            ContractSystems,
            Coords,
            Invoices,
            Locations,
            MaintenanceVisits,
            Persons,
            Places,
            PlaceOwners,
            Owners,
            Systems,
            Visits
        ]
    });

    sync = true;
    await sequelize.sync();
    return sequelize;
}

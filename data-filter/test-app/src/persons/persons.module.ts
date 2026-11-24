import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { PersonsController } from "./controllers/persons.controller";
import { PersonsFilter } from "./filters/persons.filter";
import { Persons } from "./models/persons.model";

@Module({
    imports: [
        SequelizeModule.forFeature([Persons]),
        DataFilterModule.forFeature({
            filters: [{ filter: PersonsFilter }]
        })
    ],
    controllers: [PersonsController]
})
export class PersonsModule {}

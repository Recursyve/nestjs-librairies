import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Persons } from "./models/persons.model";

@Module({
    imports: [SequelizeModule.forFeature([Persons])]
})
export class PersonsModule {}

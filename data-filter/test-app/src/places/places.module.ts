import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Places } from "./models/places.model";

@Module({
    imports: [SequelizeModule.forFeature([Places])]
})
export class PlacesModule {}

import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { PlaceOwners } from "./models/place-owners.model";

@Module({
    imports: [SequelizeModule.forFeature([PlaceOwners])]
})
export class PlaceOwnersModule {}

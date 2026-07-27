import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Coords } from "./models/coords.model";

@Module({
    imports: [SequelizeModule.forFeature([Coords])]
})
export class CoordsModule {}

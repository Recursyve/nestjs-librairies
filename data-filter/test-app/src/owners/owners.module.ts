import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Owners } from "./models/owners.model";

@Module({
    imports: [SequelizeModule.forFeature([Owners])]
})
export class OwnersModule {}

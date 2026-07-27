import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Systems } from "./models/systems.model";

@Module({
    imports: [SequelizeModule.forFeature([Systems])]
})
export class SystemsModule {}

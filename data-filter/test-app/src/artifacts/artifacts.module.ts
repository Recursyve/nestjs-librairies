import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Artifacts } from "./models/artifacts.model";

@Module({
    imports: [SequelizeModule.forFeature([Artifacts])]
})
export class ArtifactsModule {}

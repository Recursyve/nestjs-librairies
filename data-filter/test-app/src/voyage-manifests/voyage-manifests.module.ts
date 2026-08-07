import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { DataFilterModule } from "@recursyve/nestjs-data-filter";
import { VoyageManifestsController, VoyageManifestsOpenApiController } from "./controllers/voyage-manifests.controller";
import { VoyageManifestsFilter } from "./filters/voyage-manifests.filter";
import { VoyageManifests } from "./models/voyage-manifests.model";

@Module({
    imports: [
        SequelizeModule.forFeature([VoyageManifests]),
        DataFilterModule.forFeature({
            filters: [{ filter: VoyageManifestsFilter }]
        })
    ],
    controllers: [VoyageManifestsController, VoyageManifestsOpenApiController]
})
export class VoyageManifestsModule {}

import { EntitiesMetadataStorage } from "@nestjs/sequelize/dist/entities-metadata.storage";
import { DEFAULT_CONNECTION_NAME } from "@nestjs/sequelize/dist/sequelize.constants";
import { AccessControlModelsFactory, M } from "@recursyve/nestjs-access-control";

export class SequelizeAccessControlModelsFactory implements AccessControlModelsFactory {
    public getModels(): Promise<typeof M[]> | typeof M[] {
        return EntitiesMetadataStorage.getEntitiesByConnection(DEFAULT_CONNECTION_NAME) as any[];
    }
}

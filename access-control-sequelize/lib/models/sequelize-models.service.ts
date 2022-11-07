import { EntitiesMetadataStorage } from "@nestjs/sequelize/dist/entities-metadata.storage";
import { DEFAULT_CONNECTION_NAME } from "@nestjs/sequelize/dist/sequelize.constants";
import { AccessControlModelsFactory } from "@recursyve/nestjs-access-control";
import { SequelizeEntities } from "@recursyve/nestjs-sequelize-utils";

export class SequelizeAccessControlModelsFactory implements AccessControlModelsFactory {
    public getModels(): Promise<typeof SequelizeEntities[]> | typeof SequelizeEntities[] {
        return EntitiesMetadataStorage.getEntitiesByConnection(DEFAULT_CONNECTION_NAME) as any[];
    }
}

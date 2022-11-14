import { EntitiesMetadataStorage } from "@nestjs/sequelize/dist/entities-metadata.storage";
import { DEFAULT_CONNECTION_NAME } from "@nestjs/sequelize/dist/sequelize.constants";
import { DatabaseAdapter, IDatabaseAdapter } from "@recursyve/nestjs-access-control";
import { SequelizeEntities } from "@recursyve/nestjs-sequelize-utils";
import { Model } from "sequelize-typescript";

@DatabaseAdapter({ type: "sequelize" })
export class SequelizeDatabaseAdapter implements IDatabaseAdapter {
    public getModels(): any[] {
        return EntitiesMetadataStorage.getEntitiesByConnection(DEFAULT_CONNECTION_NAME) as any[];
    }

    public getResourceName(model: typeof Model): string {
        return `${model.tableName}-sequelize`;
    }

    public checkIfResourceExist(model: typeof SequelizeEntities, resourceId: number, condition: any): Promise<boolean> {
        return model
            .count({
                where: {
                    [model.primaryKeyAttribute]: resourceId,
                    ...condition.where
                }
            })
            .then((x) => !!x);
    }
}

import { InjectConnection } from "@nestjs/sequelize";
import { DatabaseAdapter, IDatabaseAdapter, ResourceId } from "@recursyve/nestjs-access-control";
import { SequelizeEntities } from "@recursyve/nestjs-sequelize-utils";
import { AbstractDataType } from "sequelize";
import { Model, Sequelize } from "sequelize-typescript";

@DatabaseAdapter({ type: "sequelize" })
export class SequelizeDatabaseAdapter implements IDatabaseAdapter {
    constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

    public getModels(): any[] {
        return Object.values(this.sequelize.models);
    }

    public getResourceName(model: typeof Model): string {
        return `${model.tableName}-sequelize`;
    }

    public parseIds(model: typeof SequelizeEntities, ids: string | string[]): ResourceId | ResourceId[] {
        const primaryKey = (model.getAttributes() as any)[model.primaryKeyAttribute];
        if ((primaryKey.type as AbstractDataType).key !== "INTEGER") {
           return ids;
        }

        if (typeof ids === "string") {
            return +ids;
        }

        return ids.map(id => +id);
    }

    public async checkIfResourceExist(model: typeof SequelizeEntities, resourceId: number, condition: any): Promise<boolean> {
        return model
            .count({
                where: {
                    [model.primaryKeyAttribute]: resourceId,
                    ...condition
                }
            })
            .then((x) => !!x);
    }
}

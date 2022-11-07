import { Injectable } from "@nestjs/common";
import { DatabaseAdapter } from "@recursyve/nestjs-access-control";
import { SequelizeEntities } from "@recursyve/nestjs-sequelize-utils";
import { Model } from "sequelize-typescript";

@Injectable()
export class SequelizeDatabaseAdapter extends DatabaseAdapter {
    public getResourceName(model: typeof Model): string {
        return model.tableName;
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

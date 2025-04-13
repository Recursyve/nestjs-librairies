import { Resources } from "@recursyve/nestjs-access-control";
import { WhereOptions } from "sequelize";

export const generateWhereOptionFromAccessControlResource = (resource: Resources): WhereOptions | null => {
    if (resource.ids) {
        return {
            id: resource.ids
        };
    }

    if (resource.where) {
        return resource.where;
    }

    return null;
};

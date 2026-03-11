import { Resources } from "@recursyve/nestjs-access-control";
import { Op, WhereOptions } from "sequelize";
import { Sequelize } from "sequelize-typescript";

export const generateWhereOptionFromAccessControlResource = (resources: Resources, where?: WhereOptions): WhereOptions => {
    if (resources.ids) {
        if (!where) {
            return { id: resources.ids };
        }

        return { [Op.and]: [where, { id: resources.ids }] };
    } else if (resources.where) {
        if (!where) {
            return resources.where;
        }

        return [resources.where, where];
    } else if (resources.all) {
        if (!where) {
            return Sequelize.literal("TRUE");
        }

        return where;
    }

    return Sequelize.literal("FALSE");
};

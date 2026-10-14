import { FromPolicy } from "@recursyve/nestjs-access-control";

export const SequelizeFromPolicy = (model: any): ClassDecorator => FromPolicy(model, { type: "sequelize" });

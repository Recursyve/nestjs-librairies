import { FromPolicy } from "@recursyve/nestjs-access-control";

export const SequelizeFromPolicy = (model: any) => FromPolicy(model, { type: "sequelize" });

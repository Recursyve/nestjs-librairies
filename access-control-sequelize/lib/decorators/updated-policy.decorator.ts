import { UpdatedPolicy } from "@recursyve/nestjs-access-control";
import { Model } from "sequelize-typescript";

export const SequelizeUpdatedPolicy = (model: typeof Model): ClassDecorator => UpdatedPolicy(model, { type: "sequelize" });

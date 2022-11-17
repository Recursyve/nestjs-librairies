import { CreatedPolicy } from "@recursyve/nestjs-access-control";
import { Model } from "sequelize-typescript";

export const SequelizeCreatedPolicy = (model: typeof Model) => CreatedPolicy(model, { type: "sequelize" });

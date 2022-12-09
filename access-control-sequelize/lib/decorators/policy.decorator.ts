import { Policy } from "@recursyve/nestjs-access-control";
import { Model } from "sequelize-typescript";

export const SequelizePolicy = (model: typeof Model) => Policy(model, { type: "sequelize" });

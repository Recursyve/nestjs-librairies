import { Policy } from "@recursyve/nestjs-access-control";
import { Model } from "sequelize-typescript";

export const SequelizePolicy = (model: typeof Model): ClassDecorator => Policy(model, { type: "sequelize" });

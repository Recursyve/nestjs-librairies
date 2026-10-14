import { UpdatedPolicy } from "@recursyve/nestjs-access-control";

export const MongooseUpdatedPolicy = (model: any): ClassDecorator => UpdatedPolicy(model, { type: "mongoose" });

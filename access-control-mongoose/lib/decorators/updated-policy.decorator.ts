import { UpdatedPolicy } from "@recursyve/nestjs-access-control";

export const MongooseUpdatedPolicy = (model: any) => UpdatedPolicy(model, { type: "mongoose" });

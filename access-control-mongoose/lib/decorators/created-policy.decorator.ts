import { CreatedPolicy } from "@recursyve/nestjs-access-control";

export const MongooseCreatedPolicy = (model: any): ClassDecorator => CreatedPolicy(model, { type: "mongoose" });

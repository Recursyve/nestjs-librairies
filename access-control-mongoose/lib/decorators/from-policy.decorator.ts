import { FromPolicy } from "@recursyve/nestjs-access-control";

export const MongooseFromPolicy = (model: any): ClassDecorator => FromPolicy(model, { type: "mongoose" });

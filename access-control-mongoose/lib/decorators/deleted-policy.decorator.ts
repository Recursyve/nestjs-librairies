import { DeletedPolicy } from "@recursyve/nestjs-access-control";

export const MongooseDeletedPolicy = (model: any): ClassDecorator => DeletedPolicy(model, { type: "mongoose" });

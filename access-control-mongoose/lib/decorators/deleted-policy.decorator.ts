import { DeletedPolicy } from "@recursyve/nestjs-access-control";

export const MongooseDeletedPolicy = (model: any) => DeletedPolicy(model, { type: "mongoose" });

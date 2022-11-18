import { FromPolicy } from "@recursyve/nestjs-access-control";

export const MongooseFromPolicy = (model: any) => FromPolicy(model, { type: "mongoose" });

import { CreatedPolicy } from "@recursyve/nestjs-access-control";

export const MongooseCreatedPolicy = (model: any) => CreatedPolicy(model, { type: "mongoose" });

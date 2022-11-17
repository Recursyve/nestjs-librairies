import { Policy } from "@recursyve/nestjs-access-control";

export const MongoosePolicy = (model: any) => Policy(model, { type: "mongoose" });

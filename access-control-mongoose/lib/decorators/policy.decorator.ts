import { Policy } from "@recursyve/nestjs-access-control";

export const MongoosePolicy = (model: any): ClassDecorator => Policy(model, { type: "mongoose" });

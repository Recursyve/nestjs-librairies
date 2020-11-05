import { Model } from "mongoose";

export abstract class AccessControlAdapter {
    public abstract getResourceIds<Users>(model: Model<any>, user: Users): Promise<number[]>;
}

import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { AccessControlAdapter } from "./access-control.adapter";

@Injectable()
export class DefaultAccessControlAdapter extends AccessControlAdapter {
    public async getResourceIds<Users>(model: Model<any>, user: Users): Promise<number[]> {
        return [];
    }
}

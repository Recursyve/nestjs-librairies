import { Injectable } from "@nestjs/common";
import { M } from "../sequelize.utils";
import { AccessControlAdapter } from "./access-control.adapter";

@Injectable()
export class DefaultAccessControlAdapter extends AccessControlAdapter {
    public async getResourceIds<Users>(model: typeof M, user: Users): Promise<number[]> {
        return [];
    }
}

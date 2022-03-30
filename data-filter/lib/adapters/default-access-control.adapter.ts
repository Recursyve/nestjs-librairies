import { Injectable } from "@nestjs/common";
import { M } from "../sequelize.utils";
import { AccessControlAdapter, AccessControlResources } from "./access-control.adapter";

@Injectable()
export class DefaultAccessControlAdapter extends AccessControlAdapter {
    public async getResources<Users>(model: typeof M, user: Users): Promise<AccessControlResources> {
        return AccessControlResources.fromIds([]);
    }
}

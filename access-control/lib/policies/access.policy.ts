import { Injectable } from "@nestjs/common";
import { AccessControlResources, PolicyResources, Users } from "../models";
import { M } from "../utils";

@Injectable()
export abstract class AccessPolicy {
    public repository: typeof M;

    /**
     * @deprecated
     */
    public async getResources(user: Users): Promise<AccessControlResources[]>;
    public async getResources(user: Users): Promise<PolicyResources>;
    public async getResources(user: Users): Promise<PolicyResources | AccessControlResources[]> {
        return PolicyResources.resources([]);
    }
}

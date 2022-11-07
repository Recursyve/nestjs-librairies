import { Injectable } from "@nestjs/common";
import { AccessControlResources, PolicyResources, Users } from "../models";

@Injectable()
export abstract class AccessPolicy {
    public resournceName: string;

    public get name(): string {
        return (this as any).constructor.name;
    }

    /**
     * @deprecated
     */
    public async getResources(user: Users): Promise<AccessControlResources[]>;
    public async getResources(user: Users): Promise<PolicyResources>;
    public async getResources(user: Users): Promise<PolicyResources | AccessControlResources[]> {
        return PolicyResources.resources([]);
    }
}

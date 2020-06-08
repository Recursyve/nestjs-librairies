import { Injectable } from "@nestjs/common";
import { AccessControlResources, Users } from "../models";
import { M } from "../utils";

@Injectable()
export abstract class AccessPolicy {
    public repository: typeof M;

    public get name(): string {
        return (this as any).constructor.name;
    }

    public async getResources(user: Users): Promise<AccessControlResources[]> {
        return [];
    }
}

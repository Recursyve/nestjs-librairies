import { Injectable } from "@nestjs/common";

import { PolicyResources } from "../models/resources.model";
import type { Users } from "../models/users.model";

@Injectable()
export abstract class AccessPolicy {
    public type!: string;
    public resourceName!: string;

    public get name(): string {
        return this.constructor.name;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async getResources(user: Users): Promise<PolicyResources> {
        return Promise.resolve(PolicyResources.resources([]));
    }
}

import { Injectable } from "@nestjs/common";
import { isDefined } from "@recursyve/nice-ts-utils";

import type { UserResources } from "../models/user-resources.model";

@Injectable()
export abstract class ResourceAccessUpdatedPolicy<T> {
    public type!: string;
    public sourceResourceName!: string;
    public targetResourceName!: string;

    public get name(): string {
        return this.constructor.name;
    }

    public async handle(resourceId: T, accesses: UserResources[]): Promise<UserResources[]> {
        const policies = await this.getPolicies(resourceId, accesses);
        const filteredPolicies = policies.filter(isDefined);
        for (const policy of filteredPolicies) {
            policy.resourceName = this.targetResourceName;
        }

        return filteredPolicies;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected async getPolicies(resourceId: T, accesses: UserResources[]): Promise<UserResources[]> {
        return Promise.resolve([]);
    }
}

import { Injectable } from "@nestjs/common";
import { UserResources } from "../models";

@Injectable()
export abstract class ResourceAccessUpdatedPolicy<T> {
    public type: string;
    public resourceName: string;

    public get name(): string {
        return (this as any).constructor.name;
    }

    public async handle(resourceId: T, accesses: UserResources[]): Promise<UserResources[]> {
        const policies = await this.getPolicies(resourceId, accesses);
        const filteredPolicies = policies.filter(policy => policy);
        for (const policy of filteredPolicies) {
            policy.resourceName = this.resourceName;
        }

        return filteredPolicies;
    }

    protected async getPolicies(resourceId: T, accesses: UserResources[]): Promise<UserResources[]> {
        return [];
    }
}
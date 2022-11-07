import { Injectable, Logger, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { DatabaseAdapter } from "../adapters/database.adapter";
import { FROM_POLICY_METADATA, UPDATED_POLICY_METADATA } from "../decorators/constant";
import { UserResources } from "../models";
import { ResourceUpdatedPolicy } from "../policies";

@Injectable()
export class ResourceUpdatedPoliciesService {
    private readonly logger = new Logger();

    constructor(private readonly moduleRef: ModuleRef, private readonly databaseAdapter: DatabaseAdapter) {
    }

    private _policies: ResourceUpdatedPolicy<any>[] = [];

    public get policies(): ResourceUpdatedPolicy<any>[] {
        return this._policies;
    }

    public async execute(table: string, before: any, after: any): Promise<UserResources[]> {
        const policies = this._policies.filter(x => x.resourceName === table && !x.parentResourceName);
        const policiesRes = await Promise.all(policies.map(async policy => {
            try {
                this.logger.verbose(`Getting users for resource ${before.id}`, policy.name);
                const users = await policy.handle(before, after);
                this.logger.verbose(`${users.length} users found for resource ${before.id}`, policy.name);
                return users;
            } catch (e) {
                this.logger.error("", e, policy.name);
                return [];
            }
        }))
            .then(res => res.flat().map(x => ({ ...x, resourceId: before.id })));

        const parentPolicies = this._policies.filter(x => x.parentResourceName && x.parentResourceName === table);
        const parentPoliciesRes = await Promise.all(parentPolicies.map(async policy => {
            try {
                this.logger.verbose(`Getting users for resource ${before.id}`, policy.name);
                const users = await policy.handle(before, after);
                this.logger.verbose(`${users.length} users found for resource ${before.id}`, policy.name);
                return users;
            } catch (e) {
                this.logger.error("", e, policy.name);
                return [];
            }
        }));

        return [
            ...policiesRes,
            ...parentPoliciesRes.flat()
        ];
    }

    public registerPolicies(...policies: Type<ResourceUpdatedPolicy<any>>[]): void {
        policies.forEach(policy => this.registerPolicy(policy));
    }

    private registerPolicy(policy: Type<ResourceUpdatedPolicy<any>>): void {
        const instance = this.moduleRef.get(policy, { strict: false });
        if (!instance) {
            return;
        }

        const target = this.reflectModel(policy);
        instance.resourceName = this.databaseAdapter.getResourceName(target);

        const parent = this.reflectParentModel(policy);
        instance.parentResourceName = this.databaseAdapter.getResourceName(parent);

        this._policies.push(instance);
    }

    private reflectModel(policy: Type<ResourceUpdatedPolicy<any>>): any {
        return Reflect.getMetadata(UPDATED_POLICY_METADATA, policy);
    }

    private reflectParentModel(policy: Type<ResourceUpdatedPolicy<any>>): any {
        return Reflect.getMetadata(FROM_POLICY_METADATA, policy);
    }
}

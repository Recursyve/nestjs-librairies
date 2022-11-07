import { Injectable, Logger, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { DatabaseAdapter } from "../adapters/database.adapter";
import { CREATED_POLICY_METADATA, FROM_POLICY_METADATA } from "../decorators/constant";
import { UserResources } from "../models";
import { ResourceCreatedPolicy } from "../policies";

@Injectable()
export class ResourceCreatedPoliciesService {
    private readonly logger = new Logger();

    constructor(private readonly moduleRef: ModuleRef, private readonly databaseAdapter: DatabaseAdapter) {}

    private _policies: ResourceCreatedPolicy<any>[] = [];

    public get policies(): ResourceCreatedPolicy<any>[] {
        return this._policies;
    }

    public async execute(table: string, resource: any): Promise<UserResources[]> {
        const policies = this._policies.filter(x => x.resourceName === table && !x.parentResourceName);

        const policiesRes = await Promise.all(policies.map(async policy => {
            try {
                this.logger.verbose(`Getting users for resource ${resource.id}`, policy.name);
                const users = await policy.handle(resource);
                this.logger.verbose(`${users.length} users found for resource ${resource.id}`, policy.name);
                return users;
            } catch (e) {
                this.logger.error("", e, policy.name);
                return [];
            }
        }))
            .then(res => res.flat().map(x => ({ ...x, resourceId: resource.id })));

        const parentPolicies = this._policies.filter(x => x.parentResourceName && x.parentResourceName === table);
        const parentPoliciesRes = await Promise.all(parentPolicies.map(async policy => {
            try {
                this.logger.verbose(`Getting users for resource ${resource.id}`, policy.name);
                const users = await policy.handle(resource);
                this.logger.verbose(`${users.length} users found for resource ${resource.id}`, policy.name);
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

    public registerPolicies(...policies: Type<ResourceCreatedPolicy<any>>[]): void {
        policies.forEach(policy => this.registerPolicy(policy));
    }

    private registerPolicy(policy: Type<ResourceCreatedPolicy<any>>): void {
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

    private reflectModel(policy: Type<ResourceCreatedPolicy<any>>): any {
        return Reflect.getMetadata(CREATED_POLICY_METADATA, policy);
    }

    private reflectParentModel(policy: Type<ResourceCreatedPolicy<any>>): any {
        return Reflect.getMetadata(FROM_POLICY_METADATA, policy);
    }
}

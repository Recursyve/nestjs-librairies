import { Inject, Injectable, Logger, Optional, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { ACCESS_CONTROL_DEFAULT_DATABASE } from "../constant";
import { CREATED_POLICY_METADATA, FROM_POLICY_METADATA } from "../decorators/constant";
import { UserResources } from "../models";
import { PolicyConfig } from "../models/policy-config.model";
import { ResourceCreatedPolicy } from "../policies";
import { DatabaseAdaptersRegistry } from "./database-adapters.registry";

@Injectable()
export class ResourceCreatedPoliciesService {
    private readonly logger = new Logger();

    constructor(
        @Optional() @Inject(ACCESS_CONTROL_DEFAULT_DATABASE) private type: string,
        private readonly moduleRef: ModuleRef,
        private databaseAdaptersRegistry: DatabaseAdaptersRegistry
    ) {}

    private _policies: ResourceCreatedPolicy<any>[] = [];

    public get policies(): ResourceCreatedPolicy<any>[] {
        return this._policies;
    }

    public async execute(resourceName: string, resource: any): Promise<UserResources[]> {
        const policies = this._policies.filter(x => x.resourceName === resourceName && !x.parentResourceName);

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

        const parentPolicies = this._policies.filter(x => x.parentResourceName && x.parentResourceName === resourceName);
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

        const config = this.reflectModel(policy);
        instance.type = config.type ?? this.type;

        const databaseAdapter = this.databaseAdaptersRegistry.getAdapter(config.type ?? this.type)
        instance.resourceName = databaseAdapter.getResourceName(config.model);

        const parent = this.reflectParentModel(policy);
        if (parent) {
            const databaseAdapter = this.databaseAdaptersRegistry.getAdapter(parent.type ?? this.type)
            instance.parentResourceName = databaseAdapter.getResourceName(parent.model);
        }

        this._policies.push(instance);
    }

    private reflectModel(policy: Type<ResourceCreatedPolicy<any>>): PolicyConfig {
        return Reflect.getMetadata(CREATED_POLICY_METADATA, policy);
    }

    private reflectParentModel(policy: Type<ResourceCreatedPolicy<any>>): PolicyConfig {
        return Reflect.getMetadata(FROM_POLICY_METADATA, policy);
    }
}

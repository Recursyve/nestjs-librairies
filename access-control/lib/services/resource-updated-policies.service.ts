import type { Type } from "@nestjs/common";
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { isDefined, isNotEmpty } from "@recursyve/nice-ts-utils";

import { ACCESS_CONTROL_DEFAULT_DATABASE } from "../constant";
import { FROM_POLICY_METADATA, UPDATED_POLICY_METADATA } from "../decorators/constant";
import type { PolicyConfig } from "../models/policy-config.model";
import type { ResourceId } from "../models/resources.model";
import type { UserResources } from "../models/user-resources.model";
import { ResourceUpdatedPolicy } from "../policies/resource-updated-policy.service";
import { DatabaseAdaptersRegistry } from "./database-adapters.registry";

interface UpdatedResource {
    id: ResourceId;
}

@Injectable()
export class ResourceUpdatedPoliciesService {
    private readonly logger = new Logger();

    constructor(
        @Optional() @Inject(ACCESS_CONTROL_DEFAULT_DATABASE) private readonly type: string,
        private readonly moduleRef: ModuleRef,
        private readonly databaseAdaptersRegistry: DatabaseAdaptersRegistry
    ) {}

    private readonly _policies: ResourceUpdatedPolicy<UpdatedResource>[] = [];

    public get policies(): ResourceUpdatedPolicy<UpdatedResource>[] {
        return this._policies;
    }

    public exists(resourceName: string): boolean {
        return (
            this._policies.some((x) => x.resourceName === resourceName) ||
            this._policies.some((x) => x.parentResourceName === resourceName)
        );
    }

    public async execute(
        resourceName: string,
        before: UpdatedResource,
        after: UpdatedResource
    ): Promise<UserResources[]> {
        const policies = this._policies.filter(
            (x) => x.resourceName === resourceName && !isNotEmpty(x.parentResourceName)
        );
        const policiesRes = await Promise.all(
            policies.map(async (policy) => {
                try {
                    this.logger.verbose(`Getting users for resource ${before.id}`, policy.name);
                    const users = await policy.handle(before, after);
                    this.logger.verbose(`${users.length} users found for resource ${before.id}`, policy.name);
                    return users;
                } catch (e) {
                    this.logger.error("", e, policy.name);
                    return [];
                }
            })
        ).then((res) => res.flat().map((x) => ({ ...x, resourceId: before.id })));

        const parentPolicies = this._policies.filter(
            (x) => isNotEmpty(x.parentResourceName) && x.parentResourceName === resourceName
        );
        const parentPoliciesRes = await Promise.all(
            parentPolicies.map(async (policy) => {
                try {
                    this.logger.verbose(`Getting users for resource ${before.id}`, policy.name);
                    const users = await policy.handle(before, after);
                    this.logger.verbose(`${users.length} users found for resource ${before.id}`, policy.name);
                    return users;
                } catch (e) {
                    this.logger.error("", e, policy.name);
                    return [];
                }
            })
        );

        return [...policiesRes, ...parentPoliciesRes.flat()];
    }

    public registerPolicies(...policies: Type<ResourceUpdatedPolicy<UpdatedResource>>[]): void {
        policies.forEach((policy) => {
            this.registerPolicy(policy);
        });
    }

    private registerPolicy(policy: Type<ResourceUpdatedPolicy<UpdatedResource>>): void {
        const instance = this.moduleRef.get(policy, { strict: false });
        if (!isDefined(instance)) {
            return;
        }

        const config = this.reflectModel(policy);
        instance.type = config.type ?? this.type;

        const databaseAdapter = this.databaseAdaptersRegistry.getAdapter(config.type ?? this.type);
        instance.resourceName = databaseAdapter.getResourceName(config.model);

        const parent = this.reflectParentModel(policy);
        if (isDefined(parent)) {
            const parentDatabaseAdapter = this.databaseAdaptersRegistry.getAdapter(parent.type ?? this.type);
            instance.parentResourceName = parentDatabaseAdapter.getResourceName(parent.model);
        }

        this._policies.push(instance);
    }

    private reflectModel(policy: Type<ResourceUpdatedPolicy<UpdatedResource>>): PolicyConfig {
        return Reflect.getMetadata(UPDATED_POLICY_METADATA, policy) as PolicyConfig;
    }

    private reflectParentModel(policy: Type<ResourceUpdatedPolicy<UpdatedResource>>): PolicyConfig | undefined {
        return Reflect.getMetadata(FROM_POLICY_METADATA, policy) as PolicyConfig | undefined;
    }
}

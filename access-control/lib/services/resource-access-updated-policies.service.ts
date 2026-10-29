import type { Type } from "@nestjs/common";
import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { isDefined } from "@recursyve/nice-ts-utils";

import type { AccessControlModel } from "../adapters/database.adapter";
import { ACCESS_CONTROL_DEFAULT_DATABASE } from "../constant";
import { RESOURCE_ACCESS_UPDATED_METADATA } from "../decorators/constant";
import type {
    AccessControlPolicyModel,
    AccessControlPolicyModelRef,
    ResourceAccessUpdatedPolicyConfig
} from "../models/resource-access-updated-policy-config.model";
import type { ResourceId } from "../models/resources.model";
import type { UserResources } from "../models/user-resources.model";
import { ResourceAccessUpdatedPolicy } from "../policies/resource-access-updated-policy.service";
import { DatabaseAdaptersRegistry } from "./database-adapters.registry";

@Injectable()
export class ResourceAccessUpdatedPoliciesService {
    private readonly logger = new Logger(ResourceAccessUpdatedPoliciesService.name);

    constructor(
        @Optional() @Inject(ACCESS_CONTROL_DEFAULT_DATABASE) private readonly type: string,
        private readonly moduleRef: ModuleRef,
        private readonly databaseAdaptersRegistry: DatabaseAdaptersRegistry
    ) {}

    private readonly _policies: ResourceAccessUpdatedPolicy<ResourceId>[] = [];

    public get policies(): ResourceAccessUpdatedPolicy<ResourceId>[] {
        return this._policies;
    }

    public async execute(
        resourceName: string,
        resourceId: ResourceId,
        resourceAccesses: UserResources[]
    ): Promise<UserResources[]> {
        const policies = this._policies.filter((policy) => policy.sourceResourceName === resourceName);
        const nestedUserResources = await Promise.all(
            policies.map(async (policy) => this.executePolicy(policy, resourceId, resourceAccesses))
        );
        return nestedUserResources.flat();
    }

    private async executePolicy(
        policy: ResourceAccessUpdatedPolicy<ResourceId>,
        resourceId: ResourceId,
        accesses: UserResources[]
    ): Promise<UserResources[]> {
        try {
            this.logger.verbose(`Executing policy for resource '${resourceId}'`, policy.name);
            const userResources = await policy.handle(resourceId, accesses);
            this.logger.verbose(`Policy execution complete for resource '${resourceId}'`, policy.name);
            return userResources;
        } catch (err) {
            this.logger.error(`Failed to handle policy for resource '${resourceId}'`, err, policy.name);
            return [];
        }
    }

    public registerPolicies(policies: Type<ResourceAccessUpdatedPolicy<ResourceId>>[]): void {
        for (const policy of policies) {
            this.registerPolicy(policy);
        }
    }

    private registerPolicy(policy: Type<ResourceAccessUpdatedPolicy<ResourceId>>): void {
        const instance = this.moduleRef.get(policy, { strict: false });
        if (!isDefined(instance)) {
            this.logger.error(`Tried to register policy '${policy.name}', but it was not found in the module ref.`);
            return;
        }

        const config = this.reflectModel(policy);
        if (!isDefined(config)) {
            this.logger.error(`Policy '${policy.name}' is missing @AccessUpdatedPolicy metadata.`);
            return;
        }

        const sourceModel = this.resolveModelForAdapter(config.source);
        const sourceType = this.resolveTypeForAdapter(config.source, this.type);
        const sourceDatabaseAdapter = this.databaseAdaptersRegistry.getAdapter(sourceType);
        instance.sourceResourceName = sourceDatabaseAdapter.getResourceName(sourceModel);

        const targetModel = this.resolveModelForAdapter(config.target);
        const targetType = this.resolveTypeForAdapter(config.target, this.type);
        const targetDatabaseAdapter = this.databaseAdaptersRegistry.getAdapter(targetType);
        instance.targetResourceName = targetDatabaseAdapter.getResourceName(targetModel);

        this._policies.push(instance);
    }

    private reflectModel(
        policy: Type<ResourceAccessUpdatedPolicy<ResourceId>>
    ): ResourceAccessUpdatedPolicyConfig | undefined {
        return Reflect.getMetadata(RESOURCE_ACCESS_UPDATED_METADATA, policy) as
            | ResourceAccessUpdatedPolicyConfig
            | undefined;
    }

    private isPolicyModelRef(value: AccessControlPolicyModel): value is AccessControlPolicyModelRef {
        return "model" in value;
    }

    private resolveModelForAdapter(ref: AccessControlPolicyModel): AccessControlModel {
        return this.isPolicyModelRef(ref) ? ref.model : ref;
    }

    private resolveTypeForAdapter(ref: AccessControlPolicyModel, defaultType: string): string {
        if (this.isPolicyModelRef(ref) && isDefined(ref.type)) {
            return ref.type;
        }

        return defaultType;
    }
}

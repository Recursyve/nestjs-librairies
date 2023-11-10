import { Inject, Injectable, Logger, Optional, Type } from "@nestjs/common";
import { ACCESS_CONTROL_DEFAULT_DATABASE } from "../constant";
import { ModuleRef } from "@nestjs/core";
import { DatabaseAdaptersRegistry } from "./database-adapters.registry";
import { ResourceAccessUpdatedPolicy } from "../policies/resource-access-updated-policy.service";
import { PolicyConfig, UserResources } from "../models";
import { RESOURCE_ACCESS_UPDATED_METADATA } from "../decorators";
import { ResourceAccessUpdatedPolicyConfig } from "../models/resource-access-updated-policy-config.model";
import { createInvalidObservableTypeError } from "rxjs/internal/util/throwUnobservableError";

@Injectable()
export class ResourceAccessUpdatedPoliciesService {
    private readonly logger = new Logger(ResourceAccessUpdatedPoliciesService.name);

    constructor(
        @Optional() @Inject(ACCESS_CONTROL_DEFAULT_DATABASE) private type: string,
        private readonly moduleRef: ModuleRef,
        private databaseAdaptersRegistry: DatabaseAdaptersRegistry
    ) {}

    private _policies: ResourceAccessUpdatedPolicy<any>[] = [];

    public get policies(): ResourceAccessUpdatedPolicy<any>[] {
        return this._policies;
    }

    public async execute(
        resourceName: string,
        resourceId: any,
        resourceAccesses: UserResources[]
    ): Promise<UserResources[]> {
        const policies = this._policies.filter((policy) => policy.sourceResourceName === resourceName);
        const nestedUserResources = await Promise.all(
            policies.map(async (policy) => this.executePolicy(policy, resourceId, resourceAccesses))
        );
        return nestedUserResources.flat();
    }

    private async executePolicy(
        policy: ResourceAccessUpdatedPolicy<any>,
        resourceId: any,
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

    public registerPolicies(policies: Type<ResourceAccessUpdatedPolicy<any>>[]): void {
        for (const policy of policies) {
            this.registerPolicy(policy);
        }
    }

    private registerPolicy(policy: Type<ResourceAccessUpdatedPolicy<any>>): void {
        const instance = this.moduleRef.get(policy, { strict: false });
        if (!instance) {
            this.logger.error(`Tried to register policy '${policy.name}', but it was not found in the module ref.`);
        }

        const config = this.reflectModel(policy);

        const sourceDatabaseAdapter = this.databaseAdaptersRegistry.getAdapter(config.source.type ?? this.type);
        instance.sourceResourceName = sourceDatabaseAdapter.getResourceName(config.source?.model ?? config.source);

        const targetDatabaseAdapter = this.databaseAdaptersRegistry.getAdapter(config.target.type ?? this.type);
        instance.targetResourceName = targetDatabaseAdapter.getResourceName(config.target?.model ?? config.target);

        this._policies.push(instance);
    }

    private reflectModel(policy: Type<ResourceAccessUpdatedPolicy<any>>): ResourceAccessUpdatedPolicyConfig {
        return Reflect.getMetadata(RESOURCE_ACCESS_UPDATED_METADATA, policy) ?? {};
    }
}

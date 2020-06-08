import { Injectable, Logger, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Model } from "sequelize-typescript";
import { FROM_POLICY_METADATA, UPDATED_POLICY_METADATA } from "../decorators/constant";
import { UserResources } from "../models";
import { ResourceUpdatedPolicy } from "../policies";
import { M } from "../utils";

@Injectable()
export class ResourceUpdatedPoliciesService {
    private readonly logger = new Logger();
    private _policies: ResourceUpdatedPolicy<any>[] = [];

    public get policies(): ResourceUpdatedPolicy<any>[] {
        return this._policies;
    }

    constructor(private readonly moduleRef: ModuleRef) {}

    public async execute(table: string, before: any, after: any): Promise<UserResources[]> {
        const policies = this._policies.filter(x => x.repository.tableName === table && !x.parentRepository);
        const policiesRes = await Promise.all(policies.map(async policy => {
            this.logger.verbose(`Getting users for resource ${before.id}`, policy.name);
            const users = await policy.handle(before, after);
            this.logger.verbose(`${users.length} users found for resource ${before.id}`, policy.name);
            return users;
        }))
            .then(res => res.reduce((all, current) => [...all, ...current], []))
            .then(res => res.map(x => ({ ...x, resourceId: before.id })));

        const parentPolicies = this._policies.filter(x => x.parentRepository && x.parentRepository.tableName === table);
        const parentPoliciesRes = await Promise.all(parentPolicies.map(async policy => {
            this.logger.verbose(`Getting users for resource ${before.id}`, policy.name);
            const users = await policy.handle(before, after);
            this.logger.verbose(`${users.length} users found for resource ${before.id}`, policy.name);
            return users;
        }));

        return parentPoliciesRes.reduce((all, current) => [...all, ...current], policiesRes);
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
        instance.repository = target as typeof M;

        const parent = this.reflectParentModel(policy);
        instance.parentRepository = parent as typeof M;

        this._policies.push(instance);
    }

    private reflectModel(policy: Type<ResourceUpdatedPolicy<any>>): typeof Model {
        return Reflect.getMetadata(UPDATED_POLICY_METADATA, policy);
    }

    private reflectParentModel(policy: Type<ResourceUpdatedPolicy<any>>): typeof Model {
        return Reflect.getMetadata(FROM_POLICY_METADATA, policy);
    }
}

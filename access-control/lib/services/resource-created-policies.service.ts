import { Injectable, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Model } from "sequelize-typescript";
import { CREATED_POLICY_METADATA, FROM_POLICY_METADATA } from "../decorators/constant";
import { UserResources } from "../models";
import { ResourceCreatedPolicy } from "../policies";
import { M } from "../utils";

@Injectable()
export class ResourceCreatedPoliciesService {
    private _policies: ResourceCreatedPolicy<any>[] = [];

    public get policies(): ResourceCreatedPolicy<any>[] {
        return this._policies;
    }

    constructor(private readonly moduleRef: ModuleRef) {}

    public async execute(table: string, resource: any): Promise<UserResources[]> {
        const policies = this._policies.filter(x => x.repository.tableName === table && !x.parentRepository);
        const policiesRes = await Promise.all(policies.map(policy => policy.handle(resource)))
            .then(res => res.reduce((all, current) => [...all, ...current], []))
            .then(res => res.map(x => ({ ...x, resourceId: resource.id })));

        const parentPolicies = this._policies.filter(x => x.parentRepository && x.parentRepository.tableName === table);
        const parentPoliciesRes = await Promise.all(parentPolicies.map(policy => policy.handle(resource)));

        return parentPoliciesRes.reduce((all, current) => [...all, ...current], policiesRes);
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
        instance.repository = target as typeof M;

        const parent = this.reflectParentModel(policy);
        instance.parentRepository = parent as typeof M;

        this._policies.push(instance);
    }

    private reflectModel(policy: Type<ResourceCreatedPolicy<any>>): typeof Model {
        return Reflect.getMetadata(CREATED_POLICY_METADATA, policy);
    }

    private reflectParentModel(policy: Type<ResourceCreatedPolicy<any>>): typeof Model {
        return Reflect.getMetadata(FROM_POLICY_METADATA, policy);
    }
}

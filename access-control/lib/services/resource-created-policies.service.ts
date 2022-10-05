import { Injectable, Logger, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Model } from "sequelize-typescript";
import { CREATED_POLICY_METADATA, FROM_POLICY_METADATA } from "../decorators/constant";
import { UserResources } from "../models";
import { ResourceCreatedPolicy } from "../policies";
import { M } from "../utils";

@Injectable()
export class ResourceCreatedPoliciesService {
    private readonly logger = new Logger();

    constructor(private readonly moduleRef: ModuleRef) {
    }

    private _policies: ResourceCreatedPolicy<any>[] = [];

    public get policies(): ResourceCreatedPolicy<any>[] {
        return this._policies;
    }

    public async execute(table: string, resource: any): Promise<UserResources[]> {
        const policies = this._policies.filter(x => x.repository.tableName === table && !x.parentRepository);

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

        const parentPolicies = this._policies.filter(x => x.parentRepository && x.parentRepository.tableName === table);
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

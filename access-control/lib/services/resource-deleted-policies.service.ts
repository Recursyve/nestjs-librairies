import { Injectable, Logger, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Model } from "sequelize-typescript";
import { DELETED_POLICY_METADATA, FROM_POLICY_METADATA } from "../decorators/constant";
import { UserResources } from "../models";
import { ResourceDeletedPolicy } from "../policies";
import { M } from "../utils";

@Injectable()
export class ResourceDeletedPoliciesService {
    private readonly logger = new Logger();

    constructor(private readonly moduleRef: ModuleRef) {
    }

    private _policies: ResourceDeletedPolicy<any>[] = [];

    public get policies(): ResourceDeletedPolicy<any>[] {
        return this._policies;
    }

    public async execute(table: string, resource: any): Promise<UserResources[]> {
        const policies = this._policies.filter(x => x.repository.tableName === table && !x.parentRepository);
        const policiesRes = await Promise.all(policies.map(async policy => {
            try {
                this.logger.verbose(`Getting deleted resource for resource ${resource.id}`, policy.name);
                const resources = await policy.handle(resource);
                this.logger.verbose(`${resources.length} deleted resources found for resource ${resource.id}`, policy.name);
                return resources;
            } catch (e) {
                this.logger.error("", e, policy.name);
                return [];
            }
        }))
            .then(res => res.flatMap(x => ({ ...x, resourceId: resource.id })));

        const parentPolicies = this._policies.filter(x => x.parentRepository && x.parentRepository.tableName === table);
        const parentPoliciesRes = await Promise.all(parentPolicies.map(async policy => {
            try {
                this.logger.verbose(`Getting deleted resource for resource ${resource.id}`, policy.name);
                const resources = await policy.handle(resource);
                this.logger.verbose(`${resources.length} deleted resources found for resource ${resource.id}`, policy.name);
                return resources;
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

    public registerPolicies(...policies: Type<ResourceDeletedPolicy<any>>[]): void {
        policies.forEach(policy => this.registerPolicy(policy));
    }

    private registerPolicy(policy: Type<ResourceDeletedPolicy<any>>): void {
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

    private reflectModel(policy: Type<ResourceDeletedPolicy<any>>): typeof Model {
        return Reflect.getMetadata(DELETED_POLICY_METADATA, policy);
    }

    private reflectParentModel(policy: Type<ResourceDeletedPolicy<any>>): typeof Model {
        return Reflect.getMetadata(FROM_POLICY_METADATA, policy);
    }
}

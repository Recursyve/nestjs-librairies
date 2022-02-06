import { Injectable, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Model } from "sequelize-typescript";
import { POLICY_METADATA } from "../decorators/constant";
import { PolicyResources, Users } from "../models";
import { AccessPolicy } from "../policies";
import { M } from "../utils";

@Injectable()
export class AccessPoliciesService {
    private _policies: AccessPolicy[] = [];

    public get policies(): AccessPolicy[] {
        return this._policies;
    }

    constructor(private readonly moduleRef: ModuleRef) {}

    public async execute(table: string, user: Users): Promise<PolicyResources> {
        const policy = this._policies.find(x => x.repository.tableName === table);
        if (!policy) {
            return PolicyResources.resources([]);
        }
        const res = await policy.getResources(user);
        if (res instanceof Array) {
            return PolicyResources.resources(res);
        }

        return res;
    }

    public registerPolicies(...policies: Type<AccessPolicy>[]): void {
        policies.forEach(policy => this.registerPolicy(policy));
    }

    private registerPolicy(policy: Type<AccessPolicy>): void {
        const instance = this.moduleRef.get(policy, { strict: false });
        if (!instance) {
            return;
        }

        const target = this.reflectModel(policy);
        instance.repository = target as typeof M;
        this._policies.push(instance);
    }

    private reflectModel(policy: Type<AccessPolicy>): typeof Model {
        return Reflect.getMetadata(POLICY_METADATA, policy);
    }
}

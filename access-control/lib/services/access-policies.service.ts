import { Injectable, Logger, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Model } from "sequelize-typescript";
import { POLICY_METADATA } from "../decorators/constant";
import { PolicyResources, Users } from "../models";
import { AccessPolicy } from "../policies";
import { M } from "../utils";

@Injectable()
export class AccessPoliciesService {
    private readonly logger = new Logger();

    constructor(private readonly moduleRef: ModuleRef) {
    }

    private _policies: AccessPolicy[] = [];

    public get policies(): AccessPolicy[] {
        return this._policies;
    }

    public async execute(table: string, user: Users): Promise<PolicyResources> {
        const policy = this._policies.find(x => x.repository.tableName === table);
        if (!policy) {
            return PolicyResources.resources([]);
        }

        try {

            this.logger.verbose(`Getting resources for user ${user.id}`, policy.name);
            const res = await policy.getResources(user);
            this.logger.verbose(`Resources found for user ${user.id}`, policy.name);

            if (res instanceof Array) {
                return PolicyResources.resources(res);
            }


            return res;
        } catch (e) {
            this.logger.error("", e, policy.name);

            return PolicyResources.resources([]);
        }

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

import { Inject, Injectable, Optional } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { RedisService } from "@recursyve/nestjs-redis";
import { lastValueFrom } from "rxjs";
import { IDatabaseAdapter } from "../adapters";
import {
    AccessActionType,
    AccessRules,
    PolicyResourcesCondition,
    PolicyResourceTypes,
    ResourceId,
    Resources,
    Users
} from "../models";
import { PolicyConfig } from "../models/policy-config.model";
import { RedisKeyUtils } from "../utils";
import { AccessControlResourceLoaderService } from "./access-control-resource-loader.service";
import { DatabaseAdaptersRegistry } from "./database-adapters.registry";

@Injectable()
export class ResourceAccessControlService {
    @Inject()
    public redisService: RedisService;
    @Inject()
    public commandBus: CommandBus;
    @Inject()
    public databaseAdaptersRegistry: DatabaseAdaptersRegistry;
    @Inject()
    public accessControlResourceLoaderService: AccessControlResourceLoaderService

    constructor(@Optional() private config: PolicyConfig,) {}

    private _databaseAdapter: IDatabaseAdapter;

    private get databaseAdapter(): IDatabaseAdapter {
        if (!this._databaseAdapter) {
            this._databaseAdapter = this.databaseAdaptersRegistry.getAdapter(this.config.type);
        }

        return this._databaseAdapter;
    }

    private _resourceName: string;

    private get resourceName(): string {
        if (!this._resourceName) {
            this._resourceName = this.databaseAdapter.getResourceName(this.config.model);
        }

        return this._resourceName;
    }

    public async getResources(user: Users): Promise<Resources> {
        const exist = await this.accessControlsExists(user);
        if (!exist) {
            return await lastValueFrom(this.accessControlResourceLoaderService.loadResources(user, this.resourceName));
        }

        return await this.getResourcesForAction(user, AccessActionType.Read);
    }

    public async accessControlsExists(user: Users): Promise<boolean> {
        return !!(await this.redisService.get(RedisKeyUtils.userAccessControl(user, this.resourceName)));
    }

    public async accessControlsType(user: Users): Promise<PolicyResourceTypes> {
        return (await this.redisService.get(
            RedisKeyUtils.userAccessControlType(user, this.resourceName)
        )) as PolicyResourceTypes;
    }

    public async getAccessRules(user: Users, resourceId: ResourceId): Promise<AccessRules> {
        const parsedResourceId = this.databaseAdapter.parseIds(this.config.model, resourceId.toString()) as ResourceId;

        const res = await this.redisService.get(
            RedisKeyUtils.userResourceIdKey(this.resourceName, parsedResourceId, user)
        );
        if (res) {
            return AccessRules.fromString(res);
        }

        return await this.fetchAccessRules(user, parsedResourceId);
    }

    private async fetchAccessRules(user: Users, resourceId: ResourceId): Promise<AccessRules> {
        const exist = await this.accessControlsExists(user);
        if (!exist) {
            await lastValueFrom(this.accessControlResourceLoaderService.loadResources(user, this.resourceName));
        }

        const rules = await this.generateAccessRule(user, resourceId);
        await this.redisService.set(
            RedisKeyUtils.userResourceIdKey(this.resourceName, resourceId, user),
            JSON.stringify(rules)
        );
        return rules;
    }

    private async getResourcesForAction(user: Users, action: AccessActionType): Promise<Resources> {
        const type = await this.accessControlsType(user);

        if (!type || type === PolicyResourceTypes.Resources) {
            const ids = await this.redisService
                .lrange(RedisKeyUtils.userResourceActionKey(user, this.resourceName, action), 0, -1)
                .then((result) => this.databaseAdapter.parseIds(this.config.model, result) as ResourceId[]);
            return Resources.fromIds(ids);
        }
        if (type === PolicyResourceTypes.Wildcard) {
            const rule = await this.generateAccessRule(user, null);
            if (rule[action]) {
                return Resources.all();
            }

            return Resources.fromIds([]);
        }
        if (type === PolicyResourceTypes.Condition) {
            const condition = await this.getResourceCondition(user);
            if (!condition.where || !condition.rules || !condition.rules?.[action]) {
                return Resources.fromIds([]);
            }

            return Resources.fromCondition(condition.where);
        }
    }

    private async generateAccessRule(user: Users, resourceId: ResourceId): Promise<AccessRules> {
        const type = await this.accessControlsType(user);
        if (type === PolicyResourceTypes.Resources) {
            const r = await this.resourceHasAction(user, resourceId, AccessActionType.Read);
            const u = await this.resourceHasAction(user, resourceId, AccessActionType.Update);
            const d = await this.resourceHasAction(user, resourceId, AccessActionType.Delete);
            return AccessRules.rud(r, u, d);
        } else if (type === PolicyResourceTypes.Wildcard) {
            const rule = await this.redisService.get(
                RedisKeyUtils.userResourceActionWildcardKey(user, this.resourceName)
            );
            return AccessRules.fromString(rule);
        } else if (type === PolicyResourceTypes.Condition) {
            return this.fetchResourceRule(user, resourceId);
        }

        return AccessRules.none();
    }

    private async resourceHasAction(user: Users, resourceId: ResourceId, action: AccessActionType): Promise<boolean> {
        const res = await this.redisService.lrange(
            RedisKeyUtils.userResourceActionKey(user, this.resourceName, action),
            0,
            -1
        );
        return res.findIndex((value) => resourceId === this.databaseAdapter.parseIds(this.config.model, value)) >= 0;
    }

    private async getResourceCondition(user: Users): Promise<PolicyResourcesCondition<any>> {
        const res = await this.redisService.get(RedisKeyUtils.userResourceActionConditionKey(user, this.resourceName));
        return JSON.parse(res) as PolicyResourcesCondition<any>;
    }

    private async fetchResourceRule(user: Users, resourceId: ResourceId): Promise<AccessRules> {
        const condition = await this.getResourceCondition(user);
        if (!condition.where || !condition.rules) {
            return AccessRules.none();
        }

        const exist = await this.databaseAdapter.checkIfResourceExist(this.config.model, resourceId, condition.where);
        if (!exist) {
            return AccessRules.none();
        }

        return AccessRules.rud(condition.rules.r, condition.rules.u, condition.rules.d);
    }
}

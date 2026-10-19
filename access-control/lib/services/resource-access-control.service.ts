import { Inject, Injectable, Optional } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { RedisService } from "@recursyve/nestjs-redis";
import { isDefined, isNotEmpty } from "@recursyve/nice-ts-utils";
import { lastValueFrom } from "rxjs";

import type { AccessControlWhereCondition, IDatabaseAdapter } from "../adapters/database.adapter";
import { AccessActionType, AccessRules } from "../models/access-rules.model";
import type { PolicyConfig } from "../models/policy-config.model";
import type { PolicyResourcesCondition, ResourceId } from "../models/resources.model";
import { PolicyResourceTypes, Resources } from "../models/resources.model";
import type { Users } from "../models/users.model";
import { arrayUnique } from "../utils/array.utils";
import { RedisKeyUtils } from "../utils/redis-key.utils";
import { AccessControlResourceLoaderService } from "./access-control-resource-loader.service";
import { DatabaseAdaptersRegistry } from "./database-adapters.registry";

@Injectable()
export class ResourceAccessControlService {
    @Inject()
    public redisService!: RedisService;
    @Inject()
    public commandBus!: CommandBus;
    @Inject()
    public databaseAdaptersRegistry!: DatabaseAdaptersRegistry;
    @Inject()
    public accessControlResourceLoaderService!: AccessControlResourceLoaderService;

    constructor(@Optional() private readonly config: PolicyConfig) {}

    private _databaseAdapter?: IDatabaseAdapter;

    private get databaseAdapter(): IDatabaseAdapter {
        this._databaseAdapter ??= this.databaseAdaptersRegistry.getAdapter(this.config.type);
        return this._databaseAdapter;
    }

    private _resourceName?: string;

    private get resourceName(): string {
        this._resourceName ??= this.databaseAdapter.getResourceName(this.config.model);
        return this._resourceName;
    }

    public async getResources(user: Users): Promise<Resources | null> {
        const exist = await this.accessControlsExists(user);
        if (!exist) {
            return lastValueFrom(this.accessControlResourceLoaderService.loadResources(user, this.resourceName));
        }

        return this.getResourcesForAction(user, AccessActionType.Read);
    }

    public async accessControlsExists(user: Users): Promise<boolean> {
        return isNotEmpty(await this.redisService.get(RedisKeyUtils.userAccessControl(user, this.resourceName)));
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
        if (isNotEmpty(res)) {
            return AccessRules.fromString(res);
        }

        return this.fetchAccessRules(user, parsedResourceId);
    }

    public async getUsersResourceIdAccess(
        resourcesId: ResourceId | ResourceId[],
        options?: {
            role?: string;
            action?: AccessActionType;
        }
    ): Promise<Users[]> {
        if (!Array.isArray(resourcesId)) {
            resourcesId = [resourcesId];
        }

        const parsedResourceIds = arrayUnique(resourcesId).map((resourceId) =>
            this.databaseAdapter.parseIds(this.config.model, resourceId.toString())
        ) as ResourceId[];

        const keyPatterns = parsedResourceIds.map((resourceId) =>
            RedisKeyUtils.userResourceIdPattern(this.resourceName, resourceId, options?.role)
        );

        const nestedMatchedKeys = await Promise.all(
            keyPatterns.map(async (keyPattern) => this.redisService.scan(keyPattern))
        );
        const matchedKeysWithResourceId = nestedMatchedKeys.map(
            (matchedKeys, index) => [matchedKeys, parsedResourceIds[index]] as [string[], ResourceId]
        );

        const usersFromWildcard = await this.getWildcardUsersAccess(options);

        if (!nestedMatchedKeys.some((matchedKeys) => matchedKeys.length > 0)) {
            return usersFromWildcard;
        }

        const action = options?.action;
        if (!isDefined(action)) {
            const users = matchedKeysWithResourceId
                .flatMap(([matchedKeys, resourceId]) =>
                    matchedKeys.map((matchedKey) =>
                        RedisKeyUtils.extractUserFromUserResourceIdPatternMatch(
                            matchedKey,
                            this.resourceName,
                            resourceId
                        )
                    )
                )
                .filter((user): user is Users => isDefined(user));
            return arrayUnique([...users, ...usersFromWildcard], (user) => `${user.id}:${user.role}`);
        }

        const usersWithMatchedKey = matchedKeysWithResourceId
            .flatMap(([matchedKeys, resourceId]) =>
                matchedKeys.map(
                    (matchedKey) =>
                        [
                            RedisKeyUtils.extractUserFromUserResourceIdPatternMatch(
                                matchedKey,
                                this.resourceName,
                                resourceId
                            ),
                            matchedKey
                        ] as [Users | null, string]
                )
            )
            .filter((entry): entry is [Users, string] => isDefined(entry[0]));
        if (usersWithMatchedKey.length === 0) {
            return [];
        }

        const accessControlStrings = await this.redisService.mget(
            ...usersWithMatchedKey.map(([, matchedKey]) => matchedKey)
        );

        const users = usersWithMatchedKey
            .map(([user, _], index) => ({ user, accessControlStr: accessControlStrings[index] }))
            .filter(
                (entry): entry is { user: Users; accessControlStr: string } =>
                    isNotEmpty(entry.accessControlStr) && AccessRules.fromString(entry.accessControlStr).has(action)
            )
            .map((entry) => entry.user);
        return arrayUnique([...users, ...usersFromWildcard], (user) => `${user.id}:${user.role}`);
    }

    private async getWildcardUsersAccess(options?: { role?: string; action?: AccessActionType }): Promise<Users[]> {
        const matchedKeys = await this.redisService.scan(
            RedisKeyUtils.usersResourceActionWildcardPattern(this.resourceName, options?.role)
        );

        const action = options?.action;
        if (!isDefined(action)) {
            return matchedKeys
                .map((matchedKey) =>
                    RedisKeyUtils.extractUserFromUsersResourceActionWildcardPatternMatch(matchedKey, this.resourceName)
                )
                .filter(isDefined);
        }

        if (matchedKeys.length === 0) {
            return [];
        }

        const accessControlStrings = await this.redisService.mget(...matchedKeys);
        return accessControlStrings
            .map((accessControlString, index) => ({
                accessControlString,
                matchedKey: matchedKeys[index]
            }))
            .filter(
                (entry): entry is { accessControlString: string; matchedKey: string } =>
                    isNotEmpty(entry.accessControlString) && isDefined(entry.matchedKey)
            )
            .filter((entry) => AccessRules.fromString(entry.accessControlString).has(action))
            .map((entry) =>
                RedisKeyUtils.extractUserFromUsersResourceActionWildcardPatternMatch(
                    entry.matchedKey,
                    this.resourceName
                )
            )
            .filter((user): user is Users => isDefined(user));
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

    private async getResourcesForAction(user: Users, action: AccessActionType): Promise<Resources | null> {
        const type = await this.accessControlsType(user);

        switch (type) {
            case PolicyResourceTypes.Condition: {
                const condition = await this.getResourceCondition(user);
                if (!isDefined(condition) || !isDefined(condition.where) || !condition.rules[action]) {
                    return Resources.fromIds([]);
                }

                return Resources.fromCondition(condition.where);
            }

            case PolicyResourceTypes.Resources: {
                const ids = await this.redisService
                    .lrange(RedisKeyUtils.userResourceActionKey(user, this.resourceName, action), 0, -1)
                    .then((result) => this.databaseAdapter.parseIds(this.config.model, result) as ResourceId[]);

                return Resources.fromIds(ids);
            }

            case PolicyResourceTypes.Wildcard: {
                const rule = await this.generateAccessRule(user);
                if (rule[action]) {
                    return Resources.all();
                }

                return Resources.fromIds([]);
            }
        }
    }

    private async generateAccessRule(user: Users, resourceId?: ResourceId): Promise<AccessRules> {
        switch (await this.accessControlsType(user)) {
            case PolicyResourceTypes.Condition: {
                if (!isDefined(resourceId)) {
                    return AccessRules.none();
                }

                return this.fetchResourceRule(user, resourceId);
            }

            case PolicyResourceTypes.Resources: {
                if (!isDefined(resourceId)) {
                    return AccessRules.none();
                }

                const r = await this.resourceHasAction(user, resourceId, AccessActionType.Read);
                const u = await this.resourceHasAction(user, resourceId, AccessActionType.Update);
                const d = await this.resourceHasAction(user, resourceId, AccessActionType.Delete);
                return AccessRules.rud(r, u, d);
            }

            case PolicyResourceTypes.Wildcard: {
                const rule = await this.redisService.get(
                    RedisKeyUtils.userResourceActionWildcardKey(user, this.resourceName)
                );
                if (!isNotEmpty(rule)) {
                    return AccessRules.none();
                }

                return AccessRules.fromString(rule);
            }
        }
    }

    private async resourceHasAction(user: Users, resourceId: ResourceId, action: AccessActionType): Promise<boolean> {
        const res = await this.redisService.lrange(
            RedisKeyUtils.userResourceActionKey(user, this.resourceName, action),
            0,
            -1
        );

        return res.findIndex((value) => resourceId === this.databaseAdapter.parseIds(this.config.model, value)) >= 0;
    }

    private async getResourceCondition(user: Users): Promise<PolicyResourcesCondition<unknown> | null> {
        const res = await this.redisService.get(RedisKeyUtils.userResourceActionConditionKey(user, this.resourceName));
        return res !== null ? (JSON.parse(res) as PolicyResourcesCondition<unknown>) : null;
    }

    private async fetchResourceRule(user: Users, resourceId: ResourceId): Promise<AccessRules> {
        const condition = await this.getResourceCondition(user);
        if (!isDefined(condition) || !isDefined(condition.where) || !isDefined(condition.rules)) {
            return AccessRules.none();
        }

        const resourceExists = await this.databaseAdapter.checkIfResourceExist(
            this.config.model,
            resourceId,
            condition.where as AccessControlWhereCondition
        );
        if (!resourceExists) {
            return AccessRules.none();
        }

        return AccessRules.rud(condition.rules.r, condition.rules.u, condition.rules.d);
    }
}

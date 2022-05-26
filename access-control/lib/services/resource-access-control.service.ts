import { Inject, Injectable, Optional } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { RedisService } from "@recursyve/nestjs-redis";
import { GetResourcesCommand } from "../commands";
import {
    AccessActionType,
    AccessControlResources,
    AccessRules,
    PolicyResources,
    PolicyResourcesCondition,
    PolicyResourceTypes,
    Resources,
    Users
} from "../models";
import { M, RedisKeyUtils } from "../utils";

@Injectable()
export class ResourceAccessControlService {
    @Inject()
    public redisService: RedisService;
    @Inject()
    public commandBus: CommandBus;

    private get table(): string {
        return this.model.tableName;
    }

    constructor(@Optional() private model: typeof M) {}

    public async getResources(user: Users): Promise<Resources> {
        const exist = await this.accessControlsExists(user);
        if (!exist) {
            return await this.fetchResources(user);
        }

        return await this.getResourcesForAction(user, AccessActionType.Read);
    }

    /**
     * @deprecated: Use getResources instead
     */
    public async getResourceIds(user: Users): Promise<number[]> {
        const exist = await this.accessControlsExists(user);
        if (!exist) {
            return await this.fetchResources(user).then((x) => x.ids ?? []);
        }

        return await this.getResourcesForAction(user, AccessActionType.Read).then((x) => x.ids ?? []);
    }

    public async accessControlsExists(user: Users): Promise<boolean> {
        return !!(await this.redisService.get(RedisKeyUtils.userAccessControl(user, this.table)));
    }

    public async accessControlsType(user: Users): Promise<PolicyResourceTypes> {
        return await this.redisService.get(RedisKeyUtils.userAccessControlType(user, this.table)) as PolicyResourceTypes;
    }

    public async getAccessRules(user: Users, resourceId: number): Promise<AccessRules> {
        const res = await this.redisService.get(RedisKeyUtils.userResourceIdKey(this.table, resourceId, user));
        if (res) {
            return AccessRules.fromString(res);
        }

        return await this.fetchAccessRules(user, resourceId);
    }

    private async fetchResources(user: Users): Promise<Resources> {
        try {
            const res: PolicyResources = await this.commandBus.execute(
                new GetResourcesCommand(this.table, user)
            );

            await this.redisService.set(RedisKeyUtils.userAccessControlType(user, this.table), res.type);
            await this.redisService.set(RedisKeyUtils.userAccessControl(user, this.table), "1");
            await this.setAccessRules(user, res);
            if (res.type === PolicyResourceTypes.Resources) {
                return Resources.fromIds(res.resources.filter(x => x.rules.r).map(x => x.resourceId));
            }
            if (res.type === PolicyResourceTypes.Wildcard) {
                return Resources.all();
            }
            if (res.type === PolicyResourceTypes.Condition) {
                return Resources.fromCondition(res.condition.where);
            }
        } catch (e) {
            return Resources.fromIds([]);
        }
    }

    private async fetchAccessRules(user: Users, resourceId: number): Promise<AccessRules> {
        const exist = await this.accessControlsExists(user);
        if (!exist) {
            await this.fetchResources(user);
        }

        const rules = await this.generateAccessRule(user, resourceId);
        await this.redisService.set(
            RedisKeyUtils.userResourceIdKey(this.table, resourceId, user),
            JSON.stringify(rules)
        );
        return rules;
    }

    private async getResourcesForAction(user: Users, action: AccessActionType): Promise<Resources> {
        const type = await this.accessControlsType(user);

        if (!type || type === PolicyResourceTypes.Resources) {
            const ids = await this.redisService
                .lrange(RedisKeyUtils.userResourceActionKey(user, this.table, action), 0, -1)
                .then(result => result.map(x => +x));
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

    private async setAccessRules(user: Users, resources: PolicyResources) {
        if (resources.type === PolicyResourceTypes.Resources) {
            await Promise.all([
                AccessActionType.Read,
                AccessActionType.Update,
                AccessActionType.Delete
            ].map((a) => this.setAccessAction(user, resources.resources, a)));
        } else if (resources.type === PolicyResourceTypes.Wildcard) {
            await this.redisService.set(RedisKeyUtils.userResourceActionWildcardKey(user, this.table), JSON.stringify(resources.wildcard));
        } else if (resources.type === PolicyResourceTypes.Condition) {
            await this.redisService.set(RedisKeyUtils.userResourceActionConditionKey(user, this.table), JSON.stringify(resources.condition));
        }
    }

    private async setAccessAction(
        user: Users,
        resources: AccessControlResources[],
        action: AccessActionType
    ): Promise<void> {
        const values = resources
            .filter(resource => resource.rules[action])
            .map(resource => resource.resourceId.toString());
        await this.redisService.del(RedisKeyUtils.userResourceActionKey(user, this.table, action));
        await this.redisService.lpush(RedisKeyUtils.userResourceActionKey(user, this.table, action), ...values);
    }

    private async generateAccessRule(user: Users, resourceId: number): Promise<AccessRules> {
        const type = await this.accessControlsType(user);
        if (type === PolicyResourceTypes.Resources) {
            const r = await this.resourceHasAction(user, resourceId, AccessActionType.Read);
            const u = await this.resourceHasAction(user, resourceId, AccessActionType.Update);
            const d = await this.resourceHasAction(user, resourceId, AccessActionType.Delete);
            return AccessRules.rud(r, u, d);
        } else if (type === PolicyResourceTypes.Wildcard) {
            const rule = await this.redisService.get(RedisKeyUtils.userResourceActionWildcardKey(user, this.table));
            return AccessRules.fromString(rule);
        } else if (type === PolicyResourceTypes.Condition) {
            return this.fetchResourceRule(user, resourceId);
        }

        return AccessRules.none();
    }

    private async resourceHasAction(user: Users, resourceId: number, action: AccessActionType): Promise<boolean> {
        const res = await this.redisService.lrange(
            RedisKeyUtils.userResourceActionKey(user, this.table, action),
            0,
            -1
        );
        return res.findIndex(value => +value === +resourceId) >= 0;
    }

    private async getResourceCondition(user: Users): Promise<PolicyResourcesCondition> {
        const res = await this.redisService.get(RedisKeyUtils.userResourceActionConditionKey(user, this.table));
        return JSON.parse(res) as PolicyResourcesCondition;
    }

    private async fetchResourceRule(user: Users, resourceId: number): Promise<AccessRules> {
        const condition = await this.getResourceCondition(user);
        if (!condition.where || !condition.rules) {
            return AccessRules.none();
        }

        const exist = await this.model.count({
            where: {
                [this.model.primaryKeyAttribute]: resourceId,
                ...condition.where
            }
        });
        if (!exist) {
            return AccessRules.none();
        }

        return AccessRules.rud(condition.rules.r, condition.rules.u, condition.rules.d);
    }
}

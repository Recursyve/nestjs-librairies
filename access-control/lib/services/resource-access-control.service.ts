import { Inject, Injectable, Optional } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { RedisService } from "@recursyve/nestjs-redis";
import { GetResourcesCommand } from "../commands";
import { AccessActionType, AccessControlResources, AccessRules, Users } from "../models";
import { RedisKeyUtils } from "../utils";

@Injectable()
export class ResourceAccessControlService {
    @Inject()
    public redisService: RedisService;
    @Inject()
    public commandBus: CommandBus;

    constructor(@Optional() private table: string) {}

    public async getResourceIds(user: Users): Promise<number[]> {
        const exist = await this.accessControlsExists(user);
        if (!exist) {
            return await this.fetchResources(user);
        }

        return await this.getResourcesForAction(user, AccessActionType.Read);
    }

    public async accessControlsExists(user: Users): Promise<boolean> {
        return !!(await this.redisService.get(RedisKeyUtils.userAccessControl(user, this.table)));
    }

    public async getAccessRules(user: Users, resourceId: number): Promise<AccessRules> {
        const res = await this.redisService.get(RedisKeyUtils.userResourceIdKey(this.table, resourceId, user));
        if (res) {
            return JSON.parse(res);
        }

        return await this.fetchAccessRules(user, resourceId);
    }

    private async fetchResources(user: Users): Promise<number[]> {
        try {
            const resources: AccessControlResources[] = await this.commandBus.execute(
                new GetResourcesCommand(this.table, user)
            );
            await this.setAccessRules(user, resources);

            await this.redisService.set(RedisKeyUtils.userAccessControl(user, this.table), "1");
            return resources.filter(x => x.rules.r).map(x => x.resourceId);
        } catch (e) {
            return [];
        }
    }

    private async fetchAccessRules(user: Users, resourceId: number): Promise<AccessRules> {
        const exist = await this.accessControlsExists(user);
        if (!exist) {
            await this.fetchResources(user);
        }

        const r = await this.resourceHasAction(user, resourceId, AccessActionType.Read);
        const u = await this.resourceHasAction(user, resourceId, AccessActionType.Update);
        const d = await this.resourceHasAction(user, resourceId, AccessActionType.Delete);

        const rules = AccessRules.rud(r, u, d);
        await this.redisService.set(
            RedisKeyUtils.userResourceIdKey(this.table, resourceId, user),
            JSON.stringify(rules)
        );
        return rules;
    }

    private async getResourcesForAction(user: Users, action: AccessActionType): Promise<number[]> {
        return await this.redisService
            .lrange(RedisKeyUtils.userResourceActionKey(user, this.table, action), 0, -1)
            .then(result => result.map(x => +x));
    }

    private async setAccessRules(user: Users, resources: AccessControlResources[]) {
        await Promise.all([AccessActionType.Read, AccessActionType.Update, AccessActionType.Delete].map((a) => this.setAccessAction(user, resources, a)));
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

    private async resourceHasAction(user: Users, resourceId: number, action: AccessActionType): Promise<boolean> {
        const res = await this.redisService.lrange(
            RedisKeyUtils.userResourceActionKey(user, this.table, action),
            0,
            -1
        );
        return res.findIndex(value => +value === +resourceId) >= 0;
    }
}

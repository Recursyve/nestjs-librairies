import { Injectable } from "@nestjs/common";
import { RedisService } from "@recursyve/nestjs-redis";
import { AccessActionType, UserResources, Users } from "../models";
import { RedisKeyUtils } from "../utils";

@Injectable()
export class ResourceEventService {
    constructor(private redisService: RedisService) {}

    public async addUserResources(resources: UserResources[]): Promise<void> {
        await Promise.all(
            [AccessActionType.Read, AccessActionType.Update, AccessActionType.Delete].map(a => {
                return this.addAccessAction(resources, a);
            })
        );
    }

    public async removeUserResources(table: string, resourceId: number): Promise<void> {
        await this.redisService.scanDel(RedisKeyUtils.userResourceIdPattern(table, resourceId));
    }

    public async updatedUserResources(resources: UserResources[]): Promise<void> {
        await Promise.all(
            resources.map(resource =>
                this.redisService.del(
                    RedisKeyUtils.userResourceIdKey(resource.table, resource.resourceId, {
                        id: resource.userId,
                        role: resource.userRole
                    } as Users)
                )
            )
        );

        await Promise.all(
            [AccessActionType.Read, AccessActionType.Update, AccessActionType.Delete].map(a => {
                return this.updateAccessAction(resources, a);
            })
        );
    }

    private async addAccessAction(resources: UserResources[], action: AccessActionType): Promise<void> {
        const users = resources.filter(resource => resource.rules[action]);
        await Promise.all(
            users.map(user =>
                this.redisService.lpush(
                    RedisKeyUtils.userResourceActionKey({
                        id: user.userId,
                        role: user.userRole
                    } as Users, user.table, action),
                    user.resourceId.toString()
                )
            )
        );
    }

    private async updateAccessAction(resources: UserResources[], action: AccessActionType): Promise<void> {
        const newResources = resources.filter(resource => resource.rules[action]);
        await Promise.all(
            newResources.map(user =>
                this.redisService.lpush(
                    RedisKeyUtils.userResourceActionKey({
                        id: user.userId,
                        role: user.userRole
                    } as Users, user.table, action),
                    user.resourceId.toString()
                )
            )
        );

        const oldResources = resources.filter(resource => !resource.rules[action]);
        await Promise.all(
            oldResources.map(user =>
                this.redisService.lrem(
                    RedisKeyUtils.userResourceActionKey({
                        id: user.userId,
                        role: user.userRole
                    } as Users, user.table, action),
                    user.resourceId.toString()
                )
            )
        );
    }
}

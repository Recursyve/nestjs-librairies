import { Injectable } from "@nestjs/common";
import { RedisService } from "@recursyve/nestjs-redis";
import {
    AccessActionType,
    accessActionTypeValues,
    AccessControlResources,
    PolicyResources,
    PolicyResourceTypes,
    ResourceId,
    UserResources,
    Users,
} from "../models";
import { RedisKeyUtils } from "../utils";
import { CommandBus } from "@nestjs/cqrs";
import { ResourceAccessUpdatedCommand } from "../commands";

@Injectable()
export class ResourceAccessService {
    constructor(
        private redisService: RedisService,
        private commandBus: CommandBus
    ) {}

    public async setUserAccessRules(
        user: Users,
        resourceName: string,
        policyResources: PolicyResources
    ): Promise<void> {
        await this.redisService.set(RedisKeyUtils.userAccessControlType(user, resourceName), policyResources.type);
        await this.redisService.set(RedisKeyUtils.userAccessControl(user, resourceName), "1");

        switch (policyResources.type) {
            case PolicyResourceTypes.Resources:
                await Promise.all(
                    accessActionTypeValues.map((action) =>
                        this.setUserAccessActions(user, resourceName, policyResources.resources, action)
                    )
                );
                break;
            case PolicyResourceTypes.Condition:
                await this.redisService.set(
                    RedisKeyUtils.userResourceActionConditionKey(user, resourceName),
                    JSON.stringify(policyResources.condition)
                );
                break;
            case PolicyResourceTypes.Wildcard:
                await this.redisService.set(
                    RedisKeyUtils.userResourceActionWildcardKey(user, resourceName),
                    JSON.stringify(policyResources.wildcard)
                );
                break;
        }
    }

    public async addUserResources(resources: UserResources[]): Promise<void> {
        await Promise.all(
            accessActionTypeValues.map((action) => {
                return this.addUserResourceAccessesAction(resources, action);
            })
        );

        await this.commandBus.execute(new ResourceAccessUpdatedCommand(resources));
    }

    public async deleteResourceAccesses(resourceName: string, resourceId: ResourceId): Promise<void> {
        await this.redisService.scanDel(RedisKeyUtils.userResourceIdPattern(resourceName, resourceId));
    }

    public async updateUserResources(resources: UserResources[]): Promise<void> {
        await Promise.all(
            resources.map((resource) =>
                this.redisService.del(
                    RedisKeyUtils.userResourceIdKey(resource.resourceName, resource.resourceId, {
                        id: resource.userId,
                        role: resource.userRole,
                    } as Users)
                )
            )
        );

        await Promise.all(accessActionTypeValues.map((a) => this.updateUserResourceAccessAction(resources, a)));

        await this.commandBus.execute(new ResourceAccessUpdatedCommand(resources));
    }

    private async addUserResourceAccessesAction(resources: UserResources[], action: AccessActionType): Promise<void> {
        const resourceIdsByCacheKey = new Map<string, string[]>();
        for (const userResource of resources) {
            if (!userResource.rules[action]) {
                continue;
            }

            const cacheKey = RedisKeyUtils.userResourceActionKey(
                { id: userResource.userId, role: userResource.userRole },
                userResource.resourceName,
                action
            );
            if (resourceIdsByCacheKey.has(cacheKey)) {
                resourceIdsByCacheKey.get(cacheKey).push(userResource.resourceId.toString());
            } else {
                resourceIdsByCacheKey.set(cacheKey, [userResource.resourceId.toString()]);
            }
        }

        await Promise.all(
            [...resourceIdsByCacheKey.entries()].map(([key, resourceIds]) =>
                this.redisService.lpush(key, ...resourceIds)
            )
        );
    }

    private async setUserAccessActions(
        user: Users,
        resourceName: string,
        resources: AccessControlResources[],
        action: AccessActionType
    ): Promise<void> {
        await this.deleteUserResourceAccessesAction(user, resourceName, action);

        const userResources: UserResources[] = resources.map((resource) => ({
            ...resource,
            userId: user.id,
            userRole: user.role,
            resourceName,
        }));
        await this.addUserResourceAccessesAction(userResources, action);
    }

    private async updateUserResourceAccessAction(
        userResources: UserResources[],
        action: AccessActionType
    ): Promise<void> {
        await this.addUserResourceAccessesAction(userResources, action);

        const resourcesToRemove = userResources.filter((resource) => !resource.rules[action]);
        await Promise.all(
            resourcesToRemove.map((userResource) =>
                this.deleteUserResourceAccessAction(
                    {
                        id: userResource.userId,
                        role: userResource.userRole,
                    },
                    { id: userResource.resourceName, name: userResource.resourceName },
                    action
                )
            )
        );
    }

    private async deleteUserResourceAccessAction(
        user: Users,
        resource: { name: string; id: ResourceId },
        action: AccessActionType
    ): Promise<void> {
        await this.redisService.lrem(
            RedisKeyUtils.userResourceActionKey(user, resource.name, action),
            resource.id.toString()
        );
    }

    private async deleteUserResourceAccessesAction(
        user: Users,
        resourceName: string,
        action: AccessActionType
    ): Promise<void> {
        await this.redisService.del(RedisKeyUtils.userResourceActionKey(user, resourceName, action));
    }
}

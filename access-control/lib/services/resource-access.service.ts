import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "@recursyve/nestjs-redis";
import {
    AccessActionType,
    accessActionTypeValues,
    AccessControlResources,
    PolicyResources,
    PolicyResourceTypes,
    ResourceId,
    UserResources,
    Users
} from "../models";
import { RedisKeyUtils } from "../utils";
import { CommandBus } from "@nestjs/cqrs";
import { ResourceAccessUpdatedCommand } from "../commands";

@Injectable()
export class ResourceAccessService {
    private logger = new Logger(ResourceAccessService.name);

    constructor(
        private redisService: RedisService,
        private commandBus: CommandBus
    ) {}

    public async setUserAccessRules(
        user: Users,
        resourceName: string,
        policyResources: PolicyResources
    ): Promise<void> {
        await this.setUserAccessControlType(user, resourceName, policyResources.type);

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

    public async addUserResources(userResources: UserResources[]): Promise<void> {
        const filteredUserResources = await this.filterOutUninitializedUserResources(userResources);

        await Promise.all(
            accessActionTypeValues.map((action) => {
                return this.addUserResourceAccessesAction(filteredUserResources, action);
            })
        );

        await this.commandBus.execute(new ResourceAccessUpdatedCommand(filteredUserResources));
    }

    public async updateUserResources(userResources: UserResources[]): Promise<void> {
        const filteredUserResources = await this.filterOutUninitializedUserResources(userResources);

        await Promise.all(
            filteredUserResources.map((userResource) =>
                this.redisService.del(
                    RedisKeyUtils.userResourceIdKey(userResource.resourceName, userResource.resourceId, {
                        id: userResource.userId,
                        role: userResource.userRole
                    } as Users)
                )
            )
        );

        await Promise.all(
            accessActionTypeValues.map((a) => this.updateUserResourceAccessAction(filteredUserResources, a))
        );

        await this.commandBus.execute(new ResourceAccessUpdatedCommand(filteredUserResources));
    }

    public async deleteResourceAccesses(resourceName: string, resourceId: ResourceId): Promise<void> {
        await this.redisService.scanDel(RedisKeyUtils.userResourceIdPattern(resourceName, resourceId));
    }

    private async setUserAccessControlType(
        user: Users,
        resourceName: string,
        type: PolicyResourceTypes
    ): Promise<void> {
        await Promise.all([
            this.redisService.set(RedisKeyUtils.userAccessControl(user, resourceName), "1"),
            this.redisService.set(RedisKeyUtils.userAccessControlType(user, resourceName), type)
        ]);
    }

    private async filterOutUninitializedUserResources(userResources: UserResources[]): Promise<UserResources[]> {
        const groupedUserResources: Record<string, UserResources[]> = {};
        for (const userResource of userResources) {
            const key = RedisKeyUtils.userAccessControl(
                { id: userResource.userId, role: userResource.userRole },
                userResource.resourceName
            );
            if (!groupedUserResources[key]) {
                groupedUserResources[key] = [userResource];
            } else {
                groupedUserResources[key].push(userResource);
            }
        }

        const groupedUserResourcesEntries = Object.entries(groupedUserResources);
        const hasAccessControls = await Promise.all(
            groupedUserResourcesEntries.map(([key, _]) => this.redisService.get(key))
        );

        const filteredUserResources: UserResources[] = [];

        for (const [index, [_, userResources]] of groupedUserResourcesEntries.entries()) {
            if (hasAccessControls[index] !== "1") {
                this.logger.verbose(
                    `User '${userResources[0].userId}' was filtered out from '${userResources[0].resourceName}' access changes, since his access control was not yet initialized.`
                );
                continue;
            }

            filteredUserResources.push(...userResources);
        }

        return filteredUserResources;
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
            resourceName
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
                        role: userResource.userRole
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

    private extractUniqueUserResources(userResources: UserResources[]): [Users, string][] {
        const uniqueUserResources: Record<string, [Users, string]> = {};
        for (const userResource of userResources) {
            const key = `${userResource.userId}:${userResource.userRole}:${userResource.resourceName}`;
            if (!uniqueUserResources[key]) {
                uniqueUserResources[key] = [
                    { id: userResource.userId, role: userResource.userRole },
                    userResource.resourceName
                ];
            }
        }

        return Object.values(uniqueUserResources);
    }
}

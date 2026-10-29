import { Injectable, Logger } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { RedisService } from "@recursyve/nestjs-redis";
import { isDefined, isNotEmpty } from "@recursyve/nice-ts-utils";

import { ResourceAccessUpdatedCommand } from "../commands/resource-access-updated.command";
import { AccessActionType, accessActionTypeValues } from "../models/access-rules.model";
import type { AccessControlResources, ResourceId } from "../models/resources.model";
import { PolicyResourceTypes, PolicyResources } from "../models/resources.model";
import type { UserResources } from "../models/user-resources.model";
import type { Users } from "../models/users.model";
import { RedisKeyUtils } from "../utils/redis-key.utils";

@Injectable()
export class ResourceAccessService {
    private readonly logger = new Logger(ResourceAccessService.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly commandBus: CommandBus
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
                    accessActionTypeValues.map(async (action) =>
                        this.setUserAccessActions(user, resourceName, policyResources.resources ?? [], action)
                    )
                );
                await this.setUserResourceIdsRules(user, resourceName, policyResources.resources ?? []);
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
            accessActionTypeValues.map(async (action) => {
                return this.addUserResourceAccessesAction(filteredUserResources, action);
            })
        );

        await Promise.all(
            filteredUserResources.map(async (userResource) => {
                if (!this.hasResourceTarget(userResource)) {
                    return;
                }

                return this.setUserResourceIdsRules(
                    { id: userResource.userId, role: userResource.userRole },
                    userResource.resourceName,
                    [{ resourceId: userResource.resourceId, rules: userResource.rules }]
                );
            })
        );

        await this.commandBus.execute(new ResourceAccessUpdatedCommand(filteredUserResources));
    }

    public async updateUserResources(userResources: UserResources[]): Promise<void> {
        const filteredUserResources = await this.filterOutUninitializedUserResources(userResources);

        const delKeys = new Map(
            filteredUserResources.filter(this.hasResourceTarget.bind(this)).map((userResource) => [
                RedisKeyUtils.userResourceIdKey(userResource.resourceName, userResource.resourceId, {
                    id: userResource.userId,
                    role: userResource.userRole
                }),
                true
            ])
        );
        if (delKeys.size) {
            await this.redisService.del(...delKeys.keys());
        }

        await Promise.all(
            accessActionTypeValues.map(async (a) => this.updateUserResourceAccessAction(filteredUserResources, a))
        );

        await Promise.all(
            filteredUserResources.map(async (userResource) => {
                if (!this.hasResourceTarget(userResource)) {
                    return;
                }

                return this.setUserResourceIdsRules(
                    { id: userResource.userId, role: userResource.userRole },
                    userResource.resourceName,
                    [{ resourceId: userResource.resourceId, rules: userResource.rules }]
                );
            })
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
            if (!isNotEmpty(userResource.resourceName)) {
                continue;
            }

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
        if (!groupedUserResourcesEntries.length) {
            return [];
        }

        const hasAccessControls = await this.redisService.mget(...groupedUserResourcesEntries.map(([key, _]) => key));

        const filteredUserResources: UserResources[] = [];

        for (const [index, [, groupedResources]] of groupedUserResourcesEntries.entries()) {
            if (hasAccessControls[index] !== "1") {
                this.logger.verbose(
                    `User '${groupedResources[0]?.userId}' was filtered out from '${groupedResources[0]?.resourceName}' access changes, since his access control was not yet initialized.`
                );
                continue;
            }

            filteredUserResources.push(...groupedResources);
        }

        return filteredUserResources;
    }

    private async addUserResourceAccessesAction(resources: UserResources[], action: AccessActionType): Promise<void> {
        const resourceIdsByCacheKey = new Map<string, string[]>();
        for (const userResource of resources) {
            if (!userResource.rules[action]) {
                continue;
            }

            if (!this.hasResourceTarget(userResource)) {
                continue;
            }

            const cacheKey = RedisKeyUtils.userResourceActionKey(
                { id: userResource.userId, role: userResource.userRole },
                userResource.resourceName,
                action
            );
            if (resourceIdsByCacheKey.has(cacheKey)) {
                resourceIdsByCacheKey.get(cacheKey)?.push(userResource.resourceId.toString());
            } else {
                resourceIdsByCacheKey.set(cacheKey, [userResource.resourceId.toString()]);
            }
        }

        await Promise.all(
            [...resourceIdsByCacheKey.entries()].map(async ([key, resourceIds]) =>
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
            resourcesToRemove.map(async (userResource) => {
                if (!this.hasResourceTarget(userResource)) {
                    return;
                }

                return this.deleteUserResourceAccessAction(
                    {
                        id: userResource.userId,
                        role: userResource.userRole
                    },
                    { id: userResource.resourceId, name: userResource.resourceName },
                    action
                );
            })
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

    private async setUserResourceIdsRules(
        user: Users,
        resourceName: string,
        resources: AccessControlResources[]
    ): Promise<void> {
        await Promise.all(
            resources.map(async (resource) => {
                await this.redisService.set(
                    RedisKeyUtils.userResourceIdKey(resourceName, resource.resourceId, user),
                    JSON.stringify(resource.rules)
                );
            })
        );
    }

    private hasResourceTarget(
        userResource: UserResources
    ): userResource is UserResources & { resourceName: string; resourceId: ResourceId } {
        return isNotEmpty(userResource.resourceName) && isDefined(userResource.resourceId);
    }
}

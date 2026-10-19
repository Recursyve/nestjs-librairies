import type { ICommandHandler } from "@nestjs/cqrs";
import { CommandHandler } from "@nestjs/cqrs";
import { isDefined, isNotEmpty } from "@recursyve/nice-ts-utils";

import { ResourceAccessUpdatedCommand } from "../commands/resource-access-updated.command";
import type { UserResources } from "../models/user-resources.model";
import { ResourceAccessUpdatedPoliciesService } from "../services/resource-access-updated-policies.service";
import { ResourceAccessService } from "../services/resource-access.service";

@CommandHandler(ResourceAccessUpdatedCommand)
export class AccessControlResourceAccessUpdatedHandler implements ICommandHandler<ResourceAccessUpdatedCommand> {
    constructor(
        private readonly resourceAccessUpdatedPolicyService: ResourceAccessUpdatedPoliciesService,
        private readonly resourceAccessService: ResourceAccessService
    ) {}

    public async execute(command: ResourceAccessUpdatedCommand): Promise<void> {
        if (command.userResources.length === 0) {
            return;
        }

        const userResourcesByResourceMap = new Map<string, UserResources[]>();
        for (const userResource of command.userResources) {
            const key = `${userResource.resourceName}:${userResource.resourceId}`;
            const existing = userResourcesByResourceMap.get(key);
            if (isDefined(existing)) {
                existing.push(userResource);
            } else {
                userResourcesByResourceMap.set(key, [userResource]);
            }
        }

        const userResourcesByResource = [...userResourcesByResourceMap.values()];
        const nestedUserResources = await Promise.all(
            userResourcesByResource.map(async (userResources) => {
                const firstUserResource = userResources[0];
                if (!isDefined(firstUserResource?.resourceId) || !isNotEmpty(firstUserResource.resourceName)) {
                    return [];
                }

                return this.resourceAccessUpdatedPolicyService.execute(
                    firstUserResource.resourceName,
                    firstUserResource.resourceId,
                    userResources
                );
            })
        );
        const flattenedUserResources: UserResources[] = [];
        for (const [index, userResources] of nestedUserResources.entries()) {
            const sourceResourceName = userResourcesByResource[index]?.[0]?.resourceName;

            for (const userResource of userResources) {
                if (userResource.resourceName === sourceResourceName) {
                    throw new Error(`Recursive policy detected for resource '${sourceResourceName}'`);
                }

                flattenedUserResources.push(userResource);
            }
        }

        if (flattenedUserResources.length === 0) {
            return;
        }

        await this.resourceAccessService.updateUserResources(flattenedUserResources);
    }
}

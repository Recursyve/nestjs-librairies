import type { ICommandHandler } from "@nestjs/cqrs";
import { CommandHandler } from "@nestjs/cqrs";

import { ResourceDeletedCommand } from "../commands/resource-deleted.command";
import type { IdentifiedResource } from "../models/identified-resource.model";
import { ResourceAccessService } from "../services/resource-access.service";
import { ResourceDeletedPoliciesService } from "../services/resource-deleted-policies.service";

@CommandHandler(ResourceDeletedCommand)
export class AccessControlResourceDeletedHandler implements ICommandHandler<
    ResourceDeletedCommand<IdentifiedResource>
> {
    constructor(
        private readonly resourceDeletedPolicyService: ResourceDeletedPoliciesService,
        private readonly resourceAccessService: ResourceAccessService
    ) {}

    public async execute(command: ResourceDeletedCommand<IdentifiedResource>): Promise<void> {
        await this.resourceAccessService.deleteResourceAccesses(command.resourceName, command.resourceId);

        const results = await this.resourceDeletedPolicyService.execute(command.resourceName, command.resource);
        await this.resourceAccessService.updateUserResources(results);
    }
}

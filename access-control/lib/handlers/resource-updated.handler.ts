import type { ICommandHandler } from "@nestjs/cqrs";
import { CommandHandler } from "@nestjs/cqrs";

import { ResourceUpdatedCommand } from "../commands/resource-updated.command";
import type { IdentifiedResource } from "../models/identified-resource.model";
import { ResourceAccessService } from "../services/resource-access.service";
import { ResourceUpdatedPoliciesService } from "../services/resource-updated-policies.service";

@CommandHandler(ResourceUpdatedCommand)
export class AccessControlResourceUpdatedHandler implements ICommandHandler<
    ResourceUpdatedCommand<IdentifiedResource>
> {
    constructor(
        private readonly resourceUpdatedPolicyService: ResourceUpdatedPoliciesService,
        private readonly resourceAccessService: ResourceAccessService
    ) {}

    public async execute(command: ResourceUpdatedCommand<IdentifiedResource>): Promise<void> {
        const results = await this.resourceUpdatedPolicyService.execute(
            command.resourceName,
            command.before,
            command.after
        );

        await this.resourceAccessService.updateUserResources(results);
    }
}

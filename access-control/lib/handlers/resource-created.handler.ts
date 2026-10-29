import type { ICommandHandler } from "@nestjs/cqrs";
import { CommandHandler } from "@nestjs/cqrs";

import { ResourceCreatedCommand } from "../commands/resource-created.command";
import type { IdentifiedResource } from "../models/identified-resource.model";
import { ResourceAccessService } from "../services/resource-access.service";
import { ResourceCreatedPoliciesService } from "../services/resource-created-policies.service";

@CommandHandler(ResourceCreatedCommand)
export class AccessControlResourceCreatedHandler implements ICommandHandler<
    ResourceCreatedCommand<IdentifiedResource>
> {
    constructor(
        private readonly resourceCreatedPolicyService: ResourceCreatedPoliciesService,
        private readonly resourceAccessService: ResourceAccessService
    ) {}

    public async execute(command: ResourceCreatedCommand<IdentifiedResource>): Promise<void> {
        const results = await this.resourceCreatedPolicyService.execute(command.resourceName, command.resource);
        await this.resourceAccessService.addUserResources(results);
    }
}

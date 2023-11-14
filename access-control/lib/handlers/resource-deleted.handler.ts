import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ResourceDeletedCommand } from "../commands";
import { ResourceDeletedPoliciesService, ResourceAccessService } from "../services";

@CommandHandler(ResourceDeletedCommand)
export class AccessControlResourceDeletedHandler implements ICommandHandler<ResourceDeletedCommand<any>> {
    constructor(
        private resourceDeletedPolicyService: ResourceDeletedPoliciesService,
        private resourceAccessService: ResourceAccessService,
    ) {}

    public async execute(command: ResourceDeletedCommand<any>): Promise<void> {
        if (command.resourceId) {
            await this.resourceAccessService.deleteResourceAccesses(command.resourceName, command.resourceId);
        }

        const results = await this.resourceDeletedPolicyService.execute(command.resourceName, command.resource);
        if (results) {
            await this.resourceAccessService.updateUserResources(results);
        }
    }
}

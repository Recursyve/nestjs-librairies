import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { ResourceDeletedCommand } from "../commands";
import { ResourceDeletedEvent } from "../events";
import { ResourceDeletedPoliciesService, ResourceEventService } from "../services";

@CommandHandler(ResourceDeletedCommand)
export class AccessControlResourceDeletedHandler implements ICommandHandler<ResourceDeletedCommand<any>> {
    constructor(
        private resourceDeletedPolicyService: ResourceDeletedPoliciesService,
        private resourceEventService: ResourceEventService,
        private eventBus: EventBus
    ) {}

    public async execute(command: ResourceDeletedCommand<any>): Promise<void> {
        this.eventBus.publish(new ResourceDeletedEvent(command.resourceName, command.resource));

        if (command.resourceId) {
            await this.resourceEventService.removeUserResource(command.resourceName, command.resourceId);
        }

        const results = await this.resourceDeletedPolicyService.execute(command.resourceName, command.resource);
        if (results) {
            await this.resourceEventService.updatedUserResources(results);
        }
    }
}

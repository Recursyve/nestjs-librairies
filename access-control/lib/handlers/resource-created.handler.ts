import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { ResourceCreatedCommand } from "../commands";
import { ResourceCreatedEvent } from "../events";
import { ResourceCreatedPoliciesService, ResourceEventService } from "../services";

@CommandHandler(ResourceCreatedCommand)
export class AccessControlResourceCreatedHandler implements ICommandHandler<ResourceCreatedCommand<any>> {
    constructor(
        private resourceCreatedPolicyService: ResourceCreatedPoliciesService,
        private resourceEventService: ResourceEventService,
        private eventBus: EventBus
    ) {}

    public async execute(command: ResourceCreatedCommand<any>): Promise<void> {
        this.eventBus.publish(new ResourceCreatedEvent(command.resourceName, command.resource));
        const results = await this.resourceCreatedPolicyService.execute(command.resourceName, command.resource);
        if (results) {
            await this.resourceEventService.addUserResources(results);
        }
    }
}

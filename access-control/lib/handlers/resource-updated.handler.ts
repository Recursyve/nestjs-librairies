import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { ResourceUpdatedCommand } from "../commands";
import { ResourceUpdatedEvent } from "../events";
import { ResourceEventService, ResourceUpdatedPoliciesService } from "../services";

@CommandHandler(ResourceUpdatedCommand)
export class AccessControlResourceUpdatedHandler implements ICommandHandler<ResourceUpdatedCommand<any>> {
    constructor(
        private resourceUpdatedPolicyService: ResourceUpdatedPoliciesService,
        private resourceEventService: ResourceEventService,
        private eventBus: EventBus
    ) {}

    public async execute(event: ResourceUpdatedCommand<any>): Promise<void> {
        this.eventBus.publish(new ResourceUpdatedEvent(event.resourceName, event.before, event.after));
        const results = await this.resourceUpdatedPolicyService.execute(event.resourceName, event.before, event.after);
        if (results) {
            await this.resourceEventService.updatedUserResources(results);
        }
    }
}

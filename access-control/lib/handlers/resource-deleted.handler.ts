import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { ResourceDeletedCommand } from "../commands";
import { ResourceDeletedEvent } from "../events";
import { ResourceEventService } from "../services";

@CommandHandler(ResourceDeletedCommand)
export class AccessControlResourceDeletedHandler implements ICommandHandler<ResourceDeletedCommand> {
    constructor(private resourceEventService: ResourceEventService, private eventBus: EventBus) {}

    public async execute(event: ResourceDeletedCommand): Promise<void> {
        this.eventBus.publish(new ResourceDeletedEvent(event.table, event.resourceId));
        await this.resourceEventService.removeUserResources(event.table, event.resourceId);
    }
}

import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ResourceCreatedCommand, ResourceDeletedCommand, ResourceUpdatedCommand } from "../commands";

@Injectable()
export class ResourceEventAccessControlService<T> {
    constructor(private readonly commandBus: CommandBus) {}

    public onResourceCreated(resourceName: string, resource: T): Promise<any> {
        return this.commandBus.execute(new ResourceCreatedCommand(resourceName, resource));
    }

    public onResourceDeleted(resourceName: string, resource: T, resourceId: number): Promise<any> {
        return this.commandBus.execute(new ResourceDeletedCommand(resourceName, resource, resourceId));
    }

    public onResourceUpdated(resourceName: string, before: T, after: T): Promise<any> {
        return this.commandBus.execute(new ResourceUpdatedCommand(resourceName, before, after));
    }
}

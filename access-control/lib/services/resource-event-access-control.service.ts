import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ResourceCreatedCommand, ResourceDeletedCommand, ResourceUpdatedCommand } from "../commands";

@Injectable()
export class ResourceEventAccessControlService<T> {
    constructor(private readonly commandBus: CommandBus) {}

    public onResourceCreated(table: string, resource: T): Promise<any> {
        return this.commandBus.execute(new ResourceCreatedCommand(table, resource));
    }

    public onResourceDeleted(table: string, resource: T, resourceId: number): Promise<any> {
        return this.commandBus.execute(new ResourceDeletedCommand(table, resource, resourceId));
    }

    public onResourceUpdated(table: string, before: T, after: T): Promise<any> {
        return this.commandBus.execute(new ResourceUpdatedCommand(table, before, after));
    }
}

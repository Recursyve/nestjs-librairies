import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Model } from "sequelize-typescript";
import { ResourceCreatedCommand, ResourceDeletedCommand, ResourceUpdatedCommand } from "../commands";

@Injectable()
export class ResourceEventAccessControlService<T extends Model<T>> {
    constructor(private readonly commandBus: CommandBus) {}

    public onResourceCreated(table: string, resource: T): Promise<any> {
        return this.commandBus.execute(new ResourceCreatedCommand(table, resource));
    }

    public onResourceDeleted(table: string, resourceId: number): Promise<any> {
        return this.commandBus.execute(new ResourceDeletedCommand(table, resourceId));
    }

    public onResourceUpdated(table: string, before: T, after: T): Promise<any> {
        return this.commandBus.execute(new ResourceUpdatedCommand(table, before, after));
    }
}

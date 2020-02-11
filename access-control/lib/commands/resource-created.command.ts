import { ICommand } from "@nestjs/cqrs";

export class ResourceCreatedCommand<T> implements ICommand {
    constructor(public table: string, public resource: T) {}
}

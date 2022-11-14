import { ICommand } from "@nestjs/cqrs";

export class ResourceCreatedCommand<T> implements ICommand {
    constructor(public resourceName: string, public resource: T) {}
}

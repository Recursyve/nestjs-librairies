import { ICommand } from "@nestjs/cqrs";

export class ResourceUpdatedCommand<T> implements ICommand {
    constructor(public resourceName: string, public before: T, public after: T) {}
}

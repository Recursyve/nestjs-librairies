import { ICommand } from "@nestjs/cqrs";

export class ResourceDeletedCommand<T> implements ICommand {
    constructor(public resourceName: string, public resource: T, public resourceId: number) {}
}

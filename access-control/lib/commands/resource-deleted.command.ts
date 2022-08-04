import { ICommand } from "@nestjs/cqrs";

export class ResourceDeletedCommand<T> implements ICommand {
    constructor(public table: string, public resource: T, public resourceId: number) {}
}

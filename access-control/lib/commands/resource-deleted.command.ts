import { ICommand } from "@nestjs/cqrs";

export class ResourceDeletedCommand implements ICommand {
    constructor(public table: string, public resourceId: number) {}
}

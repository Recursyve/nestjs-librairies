import type { ICommand } from "@nestjs/cqrs";
import type { Users } from "../models";

export class GetResourcesCommand implements ICommand {
    constructor(public resourceName: string, public user: Users) {}
}

import { ICommand } from "@nestjs/cqrs";
import { Users } from "../models";

export class GetResourcesCommand implements ICommand {
    constructor(public resourceName: string, public user: Users) {}
}

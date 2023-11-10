import { ICommand } from "@nestjs/cqrs";
import { UserResources } from "../models";

export class ResourceAccessUpdatedCommand implements ICommand {
    constructor(public userResources: UserResources[]) {}
}

import type { ICommand } from "@nestjs/cqrs";
import type { UserResources } from "../models";

export class ResourceAccessUpdatedCommand implements ICommand {
    constructor(public userResources: UserResources[]) {}
}

import { Command } from "@nestjs/cqrs";

import type { UserResources } from "../models/user-resources.model";

export class ResourceAccessUpdatedCommand extends Command<void> {
    constructor(public userResources: UserResources[]) {
        super();
    }
}

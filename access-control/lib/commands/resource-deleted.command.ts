import { Command } from "@nestjs/cqrs";

import type { ResourceId } from "../models/resources.model";

export class ResourceDeletedCommand<T> extends Command<void> {
    constructor(
        public resourceName: string,
        public resource: T,
        public resourceId: ResourceId
    ) {
        super();
    }
}

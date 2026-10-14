import type { ICommand } from "@nestjs/cqrs";

import type { ResourceId } from "../models";

export class ResourceDeletedCommand<T> implements ICommand {
    constructor(
        public resourceName: string,
        public resource: T,
        public resourceId: ResourceId
    ) {}
}

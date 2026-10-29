import { Command } from "@nestjs/cqrs";

export class ResourceCreatedCommand<T> extends Command<void> {
    constructor(
        public resourceName: string,
        public resource: T
    ) {
        super();
    }
}

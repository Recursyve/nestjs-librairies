import { Command } from "@nestjs/cqrs";

export class ResourceUpdatedCommand<T> extends Command<void> {
    constructor(
        public resourceName: string,
        public before: T,
        public after: T
    ) {
        super();
    }
}

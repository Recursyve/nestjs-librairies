import { IEvent } from "@nestjs/cqrs";

export class ResourceUpdatedEvent<T> implements IEvent {
    constructor(public table: string, public before: T, public after: T) {}
}

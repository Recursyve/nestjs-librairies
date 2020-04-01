import { IEvent } from "@nestjs/cqrs";

export class ResourceCreatedEvent<T> implements IEvent {
    constructor(public table: string, public resource: T) {}
}

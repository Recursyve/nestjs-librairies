import { IEvent } from "@nestjs/cqrs";

export class ResourceDeletedEvent<T> implements IEvent {
    constructor(public table: string, public resourceId: T) {}
}

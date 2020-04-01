import { IEvent } from "@nestjs/cqrs";

export class ResourceDeletedEvent implements IEvent {
    constructor(public table: string, public resourceId: number) {}
}

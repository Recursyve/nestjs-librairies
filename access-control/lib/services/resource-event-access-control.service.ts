import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ResourceCreatedCommand, ResourceDeletedCommand, ResourceUpdatedCommand } from "../commands";
import { ResourceCreatedPoliciesService } from "./resource-created-policies.service";
import { ResourceDeletedPoliciesService } from "./resource-deleted-policies.service";
import { ResourceUpdatedPoliciesService } from "./resource-updated-policies.service";

@Injectable()
export class ResourceEventAccessControlService<T> {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly createdPoliciesService: ResourceCreatedPoliciesService,
        private readonly deletedPoliciesService: ResourceDeletedPoliciesService,
        private readonly updatedPoliciesService: ResourceUpdatedPoliciesService
    ) {}

    public hasCreatedPolicies(resourceName: string): boolean {
        return this.createdPoliciesService.exists(resourceName);
    }

    public hasDeletedPolicies(resourceName: string): boolean {
        return this.deletedPoliciesService.exists(resourceName);
    }

    public hasUpdatedPolicies(resourceName: string): boolean {
        return this.updatedPoliciesService.exists(resourceName);
    }

    public onResourceCreated(resourceName: string, resource: T): Promise<any> {
        return this.commandBus.execute(new ResourceCreatedCommand(resourceName, resource));
    }

    public onResourceDeleted(resourceName: string, resource: T, resourceId: number): Promise<any> {
        return this.commandBus.execute(new ResourceDeletedCommand(resourceName, resource, resourceId));
    }

    public onResourceUpdated(resourceName: string, before: T, after: T): Promise<any> {
        return this.commandBus.execute(new ResourceUpdatedCommand(resourceName, before, after));
    }
}

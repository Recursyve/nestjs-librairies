import { Global, Module, OnModuleInit } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RedisModule } from "@recursyve/nestjs-redis";
import {
    AccessControlGetResourcesHandler,
    AccessControlResourceUpdatedHandler,
    AccessControlResourceCreatedHandler,
    AccessControlResourceDeletedHandler
} from "./handlers";
import {
    AccessControlService,
    AccessPoliciesService,
    AccessControlExplorerService,
    ResourceEventAccessControlService,
    ResourceEventService,
    ResourceCreatedPoliciesService,
    ResourceUpdatedPoliciesService, ResourceDeletedPoliciesService
} from "./services";

@Global()
@Module({
    imports: [CqrsModule, RedisModule],
    providers: [
        AccessControlService,
        AccessPoliciesService,
        AccessControlExplorerService,
        ResourceEventService,
        ResourceCreatedPoliciesService,
        ResourceDeletedPoliciesService,
        ResourceUpdatedPoliciesService,
        ResourceEventAccessControlService,
        AccessControlGetResourcesHandler,
        AccessControlResourceCreatedHandler,
        AccessControlResourceUpdatedHandler,
        AccessControlResourceDeletedHandler
    ],
    exports: [CqrsModule, RedisModule, AccessControlService, AccessPoliciesService, ResourceEventAccessControlService]
})
export class AccessControlCoreModule implements OnModuleInit {
    constructor(
        private accessPoliciesService: AccessPoliciesService,
        private resourceCreatedPoliciesService: ResourceCreatedPoliciesService,
        private resourceDeletedPoliciesService: ResourceDeletedPoliciesService,
        private resourceUpdatedPoliciesService: ResourceUpdatedPoliciesService,
        private explorer: AccessControlExplorerService
    ) {}

    public onModuleInit(): void {
        const { policies, createdPolicies, updatedPolicies, deletedPolicies } = this.explorer.explore();
        this.accessPoliciesService.registerPolicies(...policies);
        this.resourceCreatedPoliciesService.registerPolicies(...createdPolicies);
        this.resourceDeletedPoliciesService.registerPolicies(...deletedPolicies);
        this.resourceUpdatedPoliciesService.registerPolicies(...updatedPolicies);
    }
}

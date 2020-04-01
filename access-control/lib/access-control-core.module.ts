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
    ResourceUpdatedPoliciesService
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
        private resourceUpdatedPoliciesService: ResourceUpdatedPoliciesService,
        private explorer: AccessControlExplorerService
    ) {}

    public onModuleInit(): void {
        const { policies, createdPolicies, updatedPolicies } = this.explorer.explore();
        this.accessPoliciesService.registerPolicies(...policies);
        this.resourceCreatedPoliciesService.registerPolicies(...createdPolicies);
        this.resourceUpdatedPoliciesService.registerPolicies(...updatedPolicies);
    }
}

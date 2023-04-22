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
import { AccessControlResourceLoaderService } from "./services/access-control-resource-loader.service";

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
        AccessControlResourceDeletedHandler,
        AccessControlResourceLoaderService
    ],
    exports: [CqrsModule, RedisModule, AccessControlService, AccessPoliciesService, ResourceEventAccessControlService, AccessControlResourceLoaderService]
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

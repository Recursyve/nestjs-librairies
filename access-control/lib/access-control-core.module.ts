import type { OnModuleInit } from "@nestjs/common";
import { Global, Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { RedisModule } from "@recursyve/nestjs-redis";

import { AccessControlGetResourcesHandler } from "./handlers/get-resources.handler";
import { AccessControlResourceAccessUpdatedHandler } from "./handlers/resource-access-updated.handler";
import { AccessControlResourceCreatedHandler } from "./handlers/resource-created.handler";
import { AccessControlResourceDeletedHandler } from "./handlers/resource-deleted.handler";
import { AccessControlResourceUpdatedHandler } from "./handlers/resource-updated.handler";
import { AccessControlExplorerService } from "./services/access-control-explorer.service";
import { AccessControlResourceLoaderService } from "./services/access-control-resource-loader.service";
import { AccessControlService } from "./services/access-control.service";
import { AccessPoliciesService } from "./services/access-policies.service";
import { DatabaseAdaptersRegistry } from "./services/database-adapters.registry";
import { ResourceAccessUpdatedPoliciesService } from "./services/resource-access-updated-policies.service";
import { ResourceAccessService } from "./services/resource-access.service";
import { ResourceCreatedPoliciesService } from "./services/resource-created-policies.service";
import { ResourceDeletedPoliciesService } from "./services/resource-deleted-policies.service";
import { ResourceEventAccessControlService } from "./services/resource-event-access-control.service";
import { ResourceUpdatedPoliciesService } from "./services/resource-updated-policies.service";

@Global()
@Module({
    imports: [CqrsModule, RedisModule],
    providers: [
        AccessControlService,
        AccessPoliciesService,
        AccessControlExplorerService,
        ResourceAccessService,
        ResourceCreatedPoliciesService,
        ResourceDeletedPoliciesService,
        ResourceUpdatedPoliciesService,
        ResourceAccessUpdatedPoliciesService,
        ResourceEventAccessControlService,
        AccessControlGetResourcesHandler,
        AccessControlResourceCreatedHandler,
        AccessControlResourceUpdatedHandler,
        AccessControlResourceDeletedHandler,
        AccessControlResourceAccessUpdatedHandler,
        AccessControlResourceLoaderService
    ],
    exports: [
        CqrsModule,
        RedisModule,
        AccessControlService,
        AccessPoliciesService,
        ResourceEventAccessControlService,
        AccessControlResourceLoaderService
    ]
})
export class AccessControlCoreModule implements OnModuleInit {
    constructor(
        private readonly accessPoliciesService: AccessPoliciesService,
        private readonly databaseAdaptersRegistry: DatabaseAdaptersRegistry,
        private readonly resourceCreatedPoliciesService: ResourceCreatedPoliciesService,
        private readonly resourceDeletedPoliciesService: ResourceDeletedPoliciesService,
        private readonly resourceUpdatedPoliciesService: ResourceUpdatedPoliciesService,
        private readonly resourceAccessUpdatedPoliciesService: ResourceAccessUpdatedPoliciesService,
        private readonly explorer: AccessControlExplorerService
    ) {}

    public onModuleInit(): void {
        const { policies, createdPolicies, updatedPolicies, deletedPolicies, accessUpdatedPolicies, databaseAdapters } =
            this.explorer.explore();
        this.databaseAdaptersRegistry.registerAdapters(...databaseAdapters);
        this.accessPoliciesService.registerPolicies(...policies);
        this.resourceCreatedPoliciesService.registerPolicies(...createdPolicies);
        this.resourceDeletedPoliciesService.registerPolicies(...deletedPolicies);
        this.resourceUpdatedPoliciesService.registerPolicies(...updatedPolicies);
        this.resourceAccessUpdatedPoliciesService.registerPolicies(accessUpdatedPolicies);
    }
}

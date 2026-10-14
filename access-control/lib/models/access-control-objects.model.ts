import type { Type } from "@nestjs/common";

import type { IDatabaseAdapter } from "../adapters";
import type { AccessPolicy, ResourceCreatedPolicy, ResourceUpdatedPolicy } from "../policies";
import type { ResourceAccessUpdatedPolicy } from "../policies/resource-access-updated-policy.service";
import type { ResourceDeletedPolicy } from "../policies/resource-deleted-policy.service";

export interface AccessControlObjects {
    policies: Type<AccessPolicy>[];
    createdPolicies: Type<ResourceCreatedPolicy<any>>[];
    updatedPolicies: Type<ResourceUpdatedPolicy<any>>[];
    deletedPolicies: Type<ResourceDeletedPolicy<any>>[];
    accessUpdatedPolicies: Type<ResourceAccessUpdatedPolicy<any>>[];
    databaseAdapters: Type<IDatabaseAdapter>[];
}

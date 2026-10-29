import type { Type } from "@nestjs/common";

import type { IDatabaseAdapter } from "../adapters/database.adapter";
import type { AccessPolicy } from "../policies/access.policy";
import type { ResourceAccessUpdatedPolicy } from "../policies/resource-access-updated-policy.service";
import type { ResourceCreatedPolicy } from "../policies/resource-created-policy.service";
import type { ResourceDeletedPolicy } from "../policies/resource-deleted-policy.service";
import type { ResourceUpdatedPolicy } from "../policies/resource-updated-policy.service";
import type { ResourceId } from "./resources.model";

export interface AccessControlObjects {
    policies: Type<AccessPolicy>[];
    createdPolicies: Type<ResourceCreatedPolicy<object>>[];
    updatedPolicies: Type<ResourceUpdatedPolicy<object>>[];
    deletedPolicies: Type<ResourceDeletedPolicy<object>>[];
    accessUpdatedPolicies: Type<ResourceAccessUpdatedPolicy<ResourceId>>[];
    databaseAdapters: Type<IDatabaseAdapter>[];
}

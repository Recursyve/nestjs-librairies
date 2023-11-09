import { Type } from "@nestjs/common";
import { IDatabaseAdapter } from "../adapters";
import { AccessPolicy, ResourceCreatedPolicy, ResourceUpdatedPolicy } from "../policies";
import { ResourceDeletedPolicy } from "../policies/resource-deleted-policy.service";
import { ResourceAccessUpdatedPolicy } from "../policies/resource-access-updated-policy.service";

export interface AccessControlObjects {
    policies: Type<AccessPolicy>[];
    createdPolicies: Type<ResourceCreatedPolicy<any>>[];
    updatedPolicies: Type<ResourceUpdatedPolicy<any>>[];
    deletedPolicies: Type<ResourceDeletedPolicy<any>>[];
    accessUpdatedPolicies: Type<ResourceAccessUpdatedPolicy<any>>[];
    databaseAdapters: Type<IDatabaseAdapter>[];
}

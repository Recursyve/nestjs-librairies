import { Type } from "@nestjs/common";
import { AccessPolicy, ResourceCreatedPolicy, ResourceUpdatedPolicy } from "../policies";
import { ResourceDeletedPolicy } from "../policies/resource-deleted-policy.service";

export interface AccessControlObjects {
    policies: Type<AccessPolicy>[];
    createdPolicies: Type<ResourceCreatedPolicy<any>>[];
    updatedPolicies: Type<ResourceUpdatedPolicy<any>>[];
    deletedPolicies: Type<ResourceDeletedPolicy<any>>[];
}

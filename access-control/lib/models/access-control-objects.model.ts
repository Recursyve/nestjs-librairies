import { Type } from "@nestjs/common";
import { AccessPolicy, ResourceCreatedPolicy, ResourceUpdatedPolicy } from "../policies";

export interface AccessControlObjects {
    policies: Type<AccessPolicy>[];
    createdPolicies: Type<ResourceCreatedPolicy<any>>[];
    updatedPolicies: Type<ResourceUpdatedPolicy<any>>[];
}

import type { IQueryHandler } from "@nestjs/cqrs";
import { QueryHandler } from "@nestjs/cqrs";

import { PolicyResources } from "../models/resources.model";
import { GetResourcesQuery } from "../queries/get-resources.query";
import { AccessPoliciesService } from "../services/access-policies.service";

@QueryHandler(GetResourcesQuery)
export class AccessControlGetResourcesHandler implements IQueryHandler<GetResourcesQuery> {
    constructor(private readonly accessPolicyService: AccessPoliciesService) {}

    public async execute(query: GetResourcesQuery): Promise<PolicyResources> {
        return this.accessPolicyService.execute(query.resourceName, query.user);
    }
}

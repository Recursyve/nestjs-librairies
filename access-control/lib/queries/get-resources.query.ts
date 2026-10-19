import { Query } from "@nestjs/cqrs";

import type { PolicyResources } from "../models/resources.model";
import type { Users } from "../models/users.model";

export class GetResourcesQuery extends Query<PolicyResources> {
    constructor(
        public resourceName: string,
        public user: Users
    ) {
        super();
    }
}

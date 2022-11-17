import { AccessRules } from "./access-rules.model";
import { ResourceId } from "./resources.model";

export interface UserResources {
    userId: string;
    rules: AccessRules;

    resourceName?: string;
    resourceId?: ResourceId;
    userRole?: string;
}

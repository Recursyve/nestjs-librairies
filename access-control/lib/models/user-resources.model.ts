import { AccessRules } from "./access-rules.model";

export interface UserResources {
    userId: string;
    rules: AccessRules;

    resourceName?: string;
    resourceId?: number | string;
    userRole?: string;
}

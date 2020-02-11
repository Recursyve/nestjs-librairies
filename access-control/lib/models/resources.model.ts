import { AccessRules } from "./access-rules.model";

export interface AccessControlResources {
    resourceId: number;
    rules: AccessRules;
}

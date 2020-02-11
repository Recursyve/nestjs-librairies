import { AccessRules } from "./access-rules.model";

export interface UserResources {
    userId: string;
    rules: AccessRules;

    table?: string;
    resourceId?: number;
}

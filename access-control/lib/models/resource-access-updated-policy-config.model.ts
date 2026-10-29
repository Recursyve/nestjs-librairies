import type { AccessControlModel } from "../adapters/database.adapter";

export interface AccessControlPolicyModelRef {
    model: AccessControlModel;
    type?: string;
}

export type AccessControlPolicyModel = AccessControlModel | AccessControlPolicyModelRef;

export interface ResourceAccessUpdatedPolicyConfig {
    source: AccessControlPolicyModel;
    target: AccessControlPolicyModel;
}

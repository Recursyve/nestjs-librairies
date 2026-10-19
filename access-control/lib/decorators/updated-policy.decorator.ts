import type { AccessControlModel } from "../adapters/database.adapter";
import type { PolicyConfig } from "../models/policy-config.model";
import { UPDATED_POLICY_METADATA } from "./constant";

export function UpdatedPolicy(model: AccessControlModel, option?: Omit<PolicyConfig, "model">): ClassDecorator {
    return (target: object) => {
        const config: Partial<PolicyConfig> = option ?? {};
        config.model = model;
        Reflect.defineMetadata(UPDATED_POLICY_METADATA, config, target);
    };
}

import type { AccessControlModel } from "../adapters/database.adapter";
import type { PolicyConfig } from "../models/policy-config.model";
import { FROM_POLICY_METADATA } from "./constant";

export function FromPolicy(model: AccessControlModel, option?: Omit<PolicyConfig, "model">): ClassDecorator {
    return (target: object) => {
        const config: Partial<PolicyConfig> = option ?? {};
        config.model = model;
        Reflect.defineMetadata(FROM_POLICY_METADATA, config, target);
    };
}

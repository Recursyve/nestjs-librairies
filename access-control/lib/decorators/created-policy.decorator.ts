import { PolicyConfig } from "../models/policy-config.model";
import { CREATED_POLICY_METADATA } from "./constant";

export function CreatedPolicy(model: any, option?: Omit<PolicyConfig, "model">): ClassDecorator {
    return (target: object) => {
        const config: Partial<PolicyConfig> = option ?? {};
        config.model = model;
        Reflect.defineMetadata(CREATED_POLICY_METADATA, config, target);
    };
}

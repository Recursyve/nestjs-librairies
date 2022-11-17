import { PolicyConfig } from "../models/policy-config.model";
import { POLICY_METADATA } from "./constant";

export function Policy(model: any, option?: Omit<PolicyConfig, "model">): ClassDecorator {
    return (target: object) => {
        const config: Partial<PolicyConfig> = option ?? {};
        config.model = model;
        Reflect.defineMetadata(POLICY_METADATA, config, target);
    };
}

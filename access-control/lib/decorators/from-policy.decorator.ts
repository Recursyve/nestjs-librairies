import { PolicyConfig } from "../models";
import { FROM_POLICY_METADATA } from "./constant";

export function FromPolicy(model: any, option?: Omit<PolicyConfig, "model">): ClassDecorator {
    return (target: object) => {
        const config: Partial<PolicyConfig> = option ?? {};
        config.model = model;
        Reflect.defineMetadata(FROM_POLICY_METADATA, config, target);
    };
}

import { PolicyConfig } from "../models/policy-config.model";
import { DELETED_POLICY_METADATA } from "./constant";

export function DeletedPolicy(model: any, option?: Omit<PolicyConfig, "model">): ClassDecorator {
    return (target: object) => {
        const config: Partial<PolicyConfig> = option ?? {};
        config.model = model;
        Reflect.defineMetadata(DELETED_POLICY_METADATA, config, target);
    };
}

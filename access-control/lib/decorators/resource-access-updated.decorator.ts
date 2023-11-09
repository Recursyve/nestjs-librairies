import { PolicyConfig } from "../models";
import { RESOURCE_ACCESS_UPDATED_METADATA } from "./constant";

export const ResourceAccessUpdated = (model: any, options?: Omit<PolicyConfig, "model">): ClassDecorator => {
    return (target: object) => {
        const config: PolicyConfig = {
            ...options,
            model
        };
        Reflect.defineMetadata(RESOURCE_ACCESS_UPDATED_METADATA, config, target);
    };
};
import type { ResourceAccessUpdatedPolicyConfig } from "../models/resource-access-updated-policy-config.model";
import { RESOURCE_ACCESS_UPDATED_METADATA } from "./constant";

export const AccessUpdatedPolicy = (config: ResourceAccessUpdatedPolicyConfig): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(RESOURCE_ACCESS_UPDATED_METADATA, config, target);
    };
};

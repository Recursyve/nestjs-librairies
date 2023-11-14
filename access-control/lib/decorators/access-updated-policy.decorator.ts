import { RESOURCE_ACCESS_UPDATED_METADATA } from "./constant";
import { ResourceAccessUpdatedPolicyConfig } from "../models/resource-access-updated-policy-config.model";

export const AccessUpdatedPolicy = (config: ResourceAccessUpdatedPolicyConfig): ClassDecorator => {
    return (target: object) => {
        Reflect.defineMetadata(RESOURCE_ACCESS_UPDATED_METADATA, config, target);
    };
};

import { UPDATED_POLICY_METADATA } from "./constant";

export function UpdatedPolicy(model: any): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(UPDATED_POLICY_METADATA, model, target);
    };
}

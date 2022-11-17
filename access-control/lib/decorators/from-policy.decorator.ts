import { FROM_POLICY_METADATA } from "./constant";

export function FromPolicy(model: any): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(FROM_POLICY_METADATA, model, target);
    };
}

import { CREATED_POLICY_METADATA } from "./constant";

export function CreatedPolicy(model: any): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(CREATED_POLICY_METADATA, model, target);
    };
}

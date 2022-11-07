import { DELETED_POLICY_METADATA } from "./constant";

export function DeletedPolicy(model: any): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(DELETED_POLICY_METADATA, model, target);
    };
}

import { POLICY_METADATA } from "./constant";

export function Policy(model: any): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(POLICY_METADATA, model, target);
    };
}

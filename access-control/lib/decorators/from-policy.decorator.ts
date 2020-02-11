import { M } from "../utils";
import { FROM_POLICY_METADATA } from "./constant";

export function FromPolicy(model: typeof M): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(FROM_POLICY_METADATA, model, target);
    };
}

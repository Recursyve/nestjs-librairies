import { M } from "../utils";
import { UPDATED_POLICY_METADATA } from "./constant";

export function UpdatedPolicy(model: typeof M): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(UPDATED_POLICY_METADATA, model, target);
    };
}

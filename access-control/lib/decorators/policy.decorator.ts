import { M } from "../utils";
import { POLICY_METADATA } from "./constant";

export function Policy(model: typeof M): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(POLICY_METADATA, model, target);
    };
}

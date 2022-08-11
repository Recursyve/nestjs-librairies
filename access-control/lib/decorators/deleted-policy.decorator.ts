import { M } from "../utils";
import { DELETED_POLICY_METADATA } from "./constant";

export function DeletedPolicy(model: typeof M): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(DELETED_POLICY_METADATA, model, target);
    };
}

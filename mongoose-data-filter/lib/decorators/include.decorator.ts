import { AttributesHandler } from "../handlers/attributes.handler";
import { IncludeConfig } from "../models/include.model";

export function Include(options: IncludeConfig): PropertyDecorator;
export function Include(path: string): PropertyDecorator;
export function Include(optionsOrPath: IncludeConfig | string): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        // Simplify just passing the path.
        if (typeof optionsOrPath === "string") {
            optionsOrPath = { path: optionsOrPath };
        }

        const attribute = AttributesHandler.getAttribute(target, propertyKey);
        attribute.addInclude(optionsOrPath);
        AttributesHandler.saveAttribute(target, attribute);
    };
}

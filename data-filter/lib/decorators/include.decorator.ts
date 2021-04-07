import { IncludeConfig } from "../models/include.model";
import { AttributesHandler } from "../handlers/attributes.handler";

export function Include(options: IncludeConfig): PropertyDecorator;
export function Include(path: string, separate?: boolean): PropertyDecorator;
export function Include(optionsOrPath: IncludeConfig | string, separate?: boolean): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        // Simplify just passing the path.
        if (typeof optionsOrPath === "string") {
            optionsOrPath = { path: optionsOrPath, separate };
        }

        const attribute = AttributesHandler.getAttribute(target, propertyKey);
        attribute.addInclude(optionsOrPath);
        AttributesHandler.saveAttribute(target, attribute);
    };
}

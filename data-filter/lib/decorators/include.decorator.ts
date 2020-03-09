import { INCLUDE } from "../constant";
import { IncludeConfig } from "../models/include.model";

export function Include(options: IncludeConfig): PropertyDecorator;
export function Include(path: string): PropertyDecorator;
export function Include(optionsOrPath: IncludeConfig | string): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        // Simplify just passing the path.
        if (typeof optionsOrPath === "string") {
            optionsOrPath = { path: optionsOrPath };
        }

        const includes: IncludeConfig[] =
            Reflect.getMetadata(INCLUDE.replace("{{include}}", propertyKey), target) || [];
        includes.push(optionsOrPath);
        Reflect.defineMetadata(INCLUDE.replace("{{include}}", propertyKey), includes, target);
    };
}

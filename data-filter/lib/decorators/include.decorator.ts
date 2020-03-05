import { INCLUDE } from "../constant";
import { IncludeConfig } from "../models/include.model";

export function Include(options: IncludeConfig | string): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        // Simplify just passing the path.
        if (typeof options === "string") {
            options = { path: options };
        }
        
        const includes: IncludeConfig[] =
            Reflect.getMetadata(INCLUDE.replace("{{include}}", propertyKey), target) || [];
        includes.push(options);
        Reflect.defineMetadata(INCLUDE.replace("{{include}}", propertyKey), includes, target);
    };
}

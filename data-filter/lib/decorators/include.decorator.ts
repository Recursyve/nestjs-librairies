import { INCLUDE } from "../constant";
import { IncludeConfig } from "../models/include.model";

export function Include(options: IncludeConfig): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        const includes: IncludeConfig[] =
            Reflect.getMetadata(INCLUDE.replace("{{include}}", propertyKey), target) ?? [];
        includes.push(options);
        Reflect.defineMetadata(INCLUDE.replace("{{include}}", propertyKey), includes, target);
    };
}

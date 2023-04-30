import { AttributesHandler } from "../handlers/attributes.handler";
import { PathConfig } from "../models/path.model";

export function Limit(limit: number): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        const attribute = AttributesHandler.getAttribute(target, propertyKey);
        const path = attribute.path ?? {} as PathConfig;
        path.limit = limit;
        attribute.setPath(path);
        AttributesHandler.saveAttribute(target, attribute);
    };
}

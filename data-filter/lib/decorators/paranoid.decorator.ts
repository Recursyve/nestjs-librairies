import { AttributesHandler } from "../handlers/attributes.handler";
import { PathConfig } from "../models/path.model";

export function Paranoid(paranoid = true): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        const attribute = AttributesHandler.getAttribute(target, propertyKey);
        const path = attribute.path ?? {} as PathConfig;
        path.paranoid = paranoid;
        attribute.setPath(path);
        AttributesHandler.saveAttribute(target, attribute);
    };
}

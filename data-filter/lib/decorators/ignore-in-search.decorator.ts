import { AttributesHandler } from "../handlers/attributes.handler";

export function IgnoreInSearch(): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        const attribute = AttributesHandler.getAttribute(target, propertyKey);
        attribute.setIgnoreInPath(true);
        AttributesHandler.saveAttribute(target, attribute);
    };
}

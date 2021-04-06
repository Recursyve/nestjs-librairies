import { AttributesHandler } from "../handlers/attributes.handler";

export function Separate(): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        const attribute = AttributesHandler.getAttribute(target, propertyKey);
        attribute.setSeparate();
        AttributesHandler.saveAttribute(target, attribute);
    };
}

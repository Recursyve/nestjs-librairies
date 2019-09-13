import { ATTRIBUTES, MODEL_ATTRIBUTES } from "../constant";
import { AttributesModel } from "../models/attributes.model";

export function Attributes(attributes?: string[]): PropertyDecorator & ClassDecorator {
    return (target: Object, propertyKey?: string) => {
        defineAttributesMetadata(target, propertyKey, attributes);
    };
}

function defineAttributesMetadata(target: Object, propertyKey?: string, options?: string[]) {
    if (!propertyKey) {
        return Reflect.defineMetadata(MODEL_ATTRIBUTES, options, target);
    }

    const attributes: AttributesModel[] = Reflect.getMetadata(ATTRIBUTES, target) || [];
    attributes.push({
        key: propertyKey,
        attributes: options
    });
    Reflect.defineMetadata(ATTRIBUTES, attributes, target);
}

import { ATTRIBUTES, MODEL_ATTRIBUTES } from "../constant";
import { AttributesModel } from "../models/attributes.model";
import { ProjectionAlias } from "sequelize";

export function Attributes(attributes?: (string | ProjectionAlias)[]): PropertyDecorator & ClassDecorator {
    return (target: Object, propertyKey?: string) => {
        defineAttributesMetadata(target, propertyKey, attributes);
    };
}

function defineAttributesMetadata(target: Object, propertyKey?: string, options?: (string | ProjectionAlias)[]) {
    if (!propertyKey) {
        return Reflect.defineMetadata(MODEL_ATTRIBUTES, options, target);
    }

    const attributes: AttributesModel[] = Reflect.getMetadata(ATTRIBUTES, target) ?? [];
    attributes.push({
        key: propertyKey,
        attributes: options
    });
    Reflect.defineMetadata(ATTRIBUTES, attributes, target);
}

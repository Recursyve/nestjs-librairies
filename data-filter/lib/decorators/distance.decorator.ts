import { CUSTOM_ATTRIBUTES, MODEL_CUSTOM_ATTRIBUTES } from "../constant";
import { DistanceAttributesConfig, DistanceConfig } from "../models/distance.model";
import { CustomAttributesConfig } from "../models/custom-attributes.model";

export function Distance(options: DistanceConfig): PropertyDecorator & ClassDecorator {
    return (target: Object, propertyKey?: string) => {
        defineCustomAttributesMetadata(target, propertyKey, options);
    };
}

function defineCustomAttributesMetadata(target: Object, propertyKey?: string, options?: DistanceConfig) {
    if (!propertyKey) {
        const attributes: CustomAttributesConfig[] = Reflect.getMetadata(MODEL_CUSTOM_ATTRIBUTES, target) || [];
        attributes.push(new DistanceAttributesConfig(propertyKey, options));
        return Reflect.defineMetadata(MODEL_CUSTOM_ATTRIBUTES, attributes, target);
    }

    const name = CUSTOM_ATTRIBUTES.replace("{{attribute}}", propertyKey);
    const attributes: CustomAttributesConfig[] = Reflect.getMetadata(name, target) || [];
    attributes.push(new DistanceAttributesConfig(propertyKey, options));
    Reflect.defineMetadata(name, attributes, target);
}

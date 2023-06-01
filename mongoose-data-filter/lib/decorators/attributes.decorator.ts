import { AttributesHandler } from "../handlers/attributes.handler";
import { DataFilterHandler } from "../handlers/data-filter.handler";

export function Attributes(attributes?: string[]): PropertyDecorator & ClassDecorator {
    return (target: Object, propertyKey?: string) => {
        defineAttributesMetadata(target, propertyKey, attributes);
    };
}

function defineAttributesMetadata(target: Object, propertyKey?: string, attributes?: string[]) {
    if (!propertyKey) {
        const dataFilter = DataFilterHandler.getDataFilter(target);
        dataFilter.setAttributes(attributes);
        DataFilterHandler.saveDataFilter(target, dataFilter);
        return;
    }

    const attribute = AttributesHandler.getAttribute(target, propertyKey);
    attribute.setAttributes(attributes);
    AttributesHandler.saveAttribute(target, attribute);
}

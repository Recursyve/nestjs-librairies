import { AttributesHandler } from "../handlers/attributes.handler";
import { DataFilterHandler } from "../handlers/data-filter.handler";

export function Attributes(): PropertyDecorator & ClassDecorator {
    return (target: Object, propertyKey?: string) => {
        defineAttributesMetadata(target, propertyKey);
    };
}

function defineAttributesMetadata(target: Object, propertyKey?: string) {
    if (!propertyKey) {
        const dataFilter = DataFilterHandler.getDataFilter(target);
        DataFilterHandler.saveDataFilter(target, dataFilter);
        return;
    }

    const attribute = AttributesHandler.getAttribute(target, propertyKey);
    AttributesHandler.saveAttribute(target, attribute);
}

import { ProjectionAlias } from "sequelize";
import { AttributesHandler } from "../handlers/attributes.handler";
import { DataFilterHandler } from "../handlers/data-filter.handler";

export function Attributes(attributes?: (string | ProjectionAlias)[]): PropertyDecorator & ClassDecorator {
    return (target: Object, propertyKey?: string) => {
        defineAttributesMetadata(target, propertyKey, attributes);
    };
}

function defineAttributesMetadata(target: Object, propertyKey?: string, options?: (string | ProjectionAlias)[]) {
    if (!propertyKey) {
        const dataFilter = DataFilterHandler.getDataFilter(target);
        dataFilter.setAttributes(options);
        DataFilterHandler.saveDataFilter(target, dataFilter);
        return;
    }

    const attribute = AttributesHandler.getAttribute(target, propertyKey);
    attribute.setAttributes(options);
    AttributesHandler.saveAttribute(target, attribute);
}

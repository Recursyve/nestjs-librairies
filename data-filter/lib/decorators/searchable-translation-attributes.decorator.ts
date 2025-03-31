import { AttributesHandler } from "../handlers/attributes.handler";
import { DataFilterHandler } from "../handlers/data-filter.handler";

export function SearchableTranslationAttributes(attributes: string[]): PropertyDecorator & ClassDecorator {
    return (target: Object, propertyKey?: string | symbol) => {
        defineSearchableTranslationAttributesMetadata(target, propertyKey, attributes);
    };
}

function defineSearchableTranslationAttributesMetadata(target: Object, propertyKey: string | symbol | undefined, attributes: string[]) {
    if (!propertyKey) {
        const dataFilter = DataFilterHandler.getDataFilter(target);
        dataFilter.setSearchableTranslationAttributes(attributes);
        DataFilterHandler.saveDataFilter(target, dataFilter);
        return;
    }

    const attribute = AttributesHandler.getAttribute(target, propertyKey);
    attribute.setSearchableTranslationAttributes(attributes);
    AttributesHandler.saveAttribute(target, attribute);
}

import { AttributesHandler } from "../handlers/attributes.handler";
import { DataFilterHandler } from "../handlers/data-filter.handler";
import { SumAttributesConfig, SumConfig } from "../models/sum.model";

export function Sum(name: string, options: SumConfig): PropertyDecorator & ClassDecorator {
    return (target: Object, propertyKey?: string) => {
        defineCustomAttributesMetadata(target, propertyKey, name, options);
    };
}

function defineCustomAttributesMetadata(target: Object, propertyKey?: string, name?: string, options?: SumConfig) {
    if (!propertyKey) {
        const dataFilter = DataFilterHandler.getDataFilter(target);
        dataFilter.addCustomAttribute(new SumAttributesConfig(name, options));
        DataFilterHandler.saveDataFilter(target, dataFilter);
        return;
    }

    const attribute = AttributesHandler.getAttribute(target, propertyKey);
    attribute.addCustomAttribute(new SumAttributesConfig(name, options));
    AttributesHandler.saveAttribute(target, attribute);
}

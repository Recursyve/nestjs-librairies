import { AttributesHandler } from "../handlers/attributes.handler";
import { DataFilterHandler } from "../handlers/data-filter.handler";
import { AddFieldExpression, AddFieldModel } from "../models/add-field.model";

export function AddField(name: string, expression: AddFieldExpression, unwind = false): PropertyDecorator & ClassDecorator {
    return (target: Object, propertyKey?: string) => {
        defineAddFieldMetadata(target, propertyKey, new AddFieldModel(name, expression, unwind));
    };
}

function defineAddFieldMetadata(target: Object, propertyKey?: string, field?: AddFieldModel) {
    if (!propertyKey) {
        const dataFilter = DataFilterHandler.getDataFilter(target);
        dataFilter.addFieldToAdd(field);
        DataFilterHandler.saveDataFilter(target, dataFilter);
        return;
    }

    const attribute = AttributesHandler.getAttribute(target, propertyKey);
    attribute.addFieldToAdd(field);
    AttributesHandler.saveAttribute(target, attribute);
}


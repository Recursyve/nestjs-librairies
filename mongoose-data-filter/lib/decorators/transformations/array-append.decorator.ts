import { TransformationsHandler } from "../../handlers/transformations.handler";
import { ArrayAppendTransformationConfig } from "../../models/transformations/array-append.transformation";

export function ArrayAppend(transformer: (value, document) => any): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        TransformationsHandler.saveTransformations(target, new ArrayAppendTransformationConfig(propertyKey, transformer));
    };
}

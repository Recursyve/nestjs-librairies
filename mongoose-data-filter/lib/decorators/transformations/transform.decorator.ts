import { TransformationsHandler } from "../../handlers/transformations.handler";
import { TransformationsConfig } from "../../models/transformations/transformations.model";

export function Transform(transformer: (value, document) => any): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        TransformationsHandler.saveTransformations(target, new TransformationsConfig(propertyKey, transformer));
    };
}

import { TransformationsHandler } from "../../handlers/transformations.handler";
import { MapTransformationConfig } from "../../models/transformations/map.transformation";
import { TransformationsConfig } from "../../models/transformations/transformations.model";

export function Map(transformer: (value, document) => any): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        TransformationsHandler.saveTransformations(target, new MapTransformationConfig(propertyKey, transformer));
    };
}

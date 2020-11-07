import { TRANSFORMATIONS } from "../constant";
import { TransformationsConfig } from "../models/transformations/transformations.model";

export class TransformationsHandler {
    public static saveTransformations(target: Object, config: TransformationsConfig): void {
        const transformations: TransformationsConfig[] = Reflect.getMetadata(TRANSFORMATIONS, target) || [];
        const index = transformations.findIndex(x => x.key === config.key);
        if (index >= 0) {
            transformations.splice(index, 1);
        }

        transformations.push(config);
        Reflect.defineMetadata(TRANSFORMATIONS, transformations, target);
    }
}

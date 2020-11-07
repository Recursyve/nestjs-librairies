import { TransformationsConfig } from "./transformations.model";

export class MapTransformationConfig extends TransformationsConfig {
    constructor(key: string, transformer: (value: any, document: any) => any) {
        super(key, transformer);
    }

    public transform(value: any, document: any): any {
        if (!(value instanceof Array)) {
            return value;
        }
        return value.map(x => super.transform(x, document));
    }
}

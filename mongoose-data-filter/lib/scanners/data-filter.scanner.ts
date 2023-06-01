import { Injectable } from "@nestjs/common";
import { ATTRIBUTES, DATA_FILTER, TRANSFORMATIONS, } from "../constant";
import { DataFilterConfig } from "../models/data-filter.model";
import { AttributesConfig } from "../models/attributes.model";
import { TransformationsConfig } from "../models/transformations/transformations.model";

@Injectable()
export class DataFilterScanner {
    public getDataFilter(target: any): DataFilterConfig {
        return Reflect.getMetadata(DATA_FILTER, target);
    }

    public getAttributes(target: any): AttributesConfig[] {
        return Reflect.getMetadata(ATTRIBUTES, target.prototype) ?? [];
    }

    public getTransformations(target: any): TransformationsConfig[] {
        return Reflect.getMetadata(TRANSFORMATIONS, target.prototype) ?? [];
    }
}

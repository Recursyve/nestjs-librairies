import { Injectable } from "@nestjs/common";
import { ATTRIBUTES, DATA_FILTER, } from "../constant";
import { DataFilterConfig } from "../models/data-filter.model";
import { AttributesConfig } from "../models/attributes.model";

@Injectable()
export class DataFilterScanner {
    public getDataFilter(target: any): DataFilterConfig {
        return Reflect.getMetadata(DATA_FILTER, target);
    }

    public getAttributes(target: any): AttributesConfig[] {
        return Reflect.getMetadata(ATTRIBUTES, target.prototype) ?? [];
    }
}

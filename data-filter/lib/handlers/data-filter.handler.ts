import { DATA_FILTER } from "../constant";
import { DataFilterConfig } from "../models/data-filter.model";

export class DataFilterHandler {
    private static _dataTargets: Object[] = [];

    public static get dataTargets(): Object[] {
        return this._dataTargets;
    }

    public static getDataFilter(target: Object): DataFilterConfig {
        const attribute: DataFilterConfig = Reflect.getMetadata(DATA_FILTER, target);
        if (!attribute) {
            return new DataFilterConfig();
        }
        return attribute;
    }

    public static saveDataFilter(target: Object, config: DataFilterConfig): void {
        const attribute: DataFilterConfig = Reflect.getMetadata(DATA_FILTER, target);
        if (attribute) {
            return;
        }

        Reflect.defineMetadata(DATA_FILTER, config, target);
        this._dataTargets.push(target);
    }
}

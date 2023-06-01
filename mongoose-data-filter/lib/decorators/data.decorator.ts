import { Model } from "mongoose";
import { DataFilterHandler } from "../handlers/data-filter.handler";

export function Data(model: any): ClassDecorator {
    return (target: object) => {
        const dataFilter = DataFilterHandler.getDataFilter(target);
        dataFilter.setModel(model);
        DataFilterHandler.saveDataFilter(target, dataFilter);
    };
}

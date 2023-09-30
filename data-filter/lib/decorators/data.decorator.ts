import { Model } from "sequelize-typescript";
import { DataFilterHandler } from "../handlers/data-filter.handler";

export function Data(model: typeof Model<any, any>): ClassDecorator {
    return (target: object) => {
        const dataFilter = DataFilterHandler.getDataFilter(target);
        dataFilter.setModel(model);
        DataFilterHandler.saveDataFilter(target, dataFilter);
    };
}

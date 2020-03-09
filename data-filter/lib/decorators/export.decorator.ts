import { DataFilterHandler } from "../handlers/data-filter.handler";

export function Exports(columns: string[]): ClassDecorator {
    return (target: object) => {
        const dataFilter = DataFilterHandler.getDataFilter(target);
        dataFilter.setExportColumns(columns);
        DataFilterHandler.saveDataFilter(target, dataFilter);
    };
}

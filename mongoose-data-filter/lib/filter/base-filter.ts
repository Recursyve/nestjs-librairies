import { Type } from "@nestjs/common";
import { OrderModel } from "..";
import { TranslateAdapter } from "../adapters/translate.adapter";
import { Filter, FilterDefinition, GroupFilter, GroupFilterDefinition } from "./filters";
import { DefaultFilterDefinition } from "./filters/default.filter";
import { FilterConfig, FilterModel, SearchableFieldModel } from "./models";

export abstract class BaseFilter<T> implements FilterModel<T> {
    [name: string]: FilterConfig | unknown;
    public abstract dataDefinition: Type<T>;
    public defaultFilter?: DefaultFilterDefinition;
    public defaultOrder?: OrderModel;
    public searchableFields?: SearchableFieldModel[];

    public set translateService(translateService: TranslateAdapter) {
        for (const key in this) {
            if (!this.hasOwnProperty(key) || key === "dataDefinition") {
                continue;
            }

            if (Filter.validate(this[key] as FilterDefinition)) {
                (this[key] as Filter).translateService = translateService;
            }
            if (GroupFilter.validate(this[key] as GroupFilterDefinition)) {
                (this[key] as GroupFilter).translateService = translateService;
            }
        }
    }
}

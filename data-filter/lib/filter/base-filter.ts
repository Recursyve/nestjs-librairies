import { Type } from "@nestjs/common";
import { TranslateAdapter } from "../adapters/translate.adapter";
import { Filter, FilterDefinition, GroupFilter, GroupFilterDefinition } from "./filters";
import { FilterConfig, FilterModel } from "./models";

export abstract class BaseFilter<T> implements FilterModel<T> {
    [name: string]: FilterConfig | unknown;
    abstract dataDefinition: Type<T>;

    public set translateService(translateService: TranslateAdapter) {
        for (const key in this) {
            if (!this.hasOwnProperty(key)) {
                continue;
            }

            if (Filter.validate(this[key] as FilterDefinition)) {
                (this[key] as Filter).translateService = translateService;
            }
            if (GroupFilter.validate(this.model[key] as GroupFilterDefinition)) {
                (this[key] as GroupFilter).translateService = translateService;
            }
        }
    }
}

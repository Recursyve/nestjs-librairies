import { Type } from "@nestjs/common";
import { TranslateAdapter } from "../adapters/translate.adapter";
import { Filter, FilterDefinition, GroupFilter, GroupFilterDefinition } from "./filters";
import { DefaultFilterDefinition } from "./filters/default.filter";
import { FilterConfig, FilterModel } from "./models";

export abstract class BaseFilter<T> implements FilterModel<T> {
    private _translateService: TranslateAdapter;

    [name: string]: FilterConfig | unknown;
    public abstract dataDefinition: Type<T>;
    public defaultFilter?: DefaultFilterDefinition;

    public set translateService(translateService: TranslateAdapter) {
        this._translateService = translateService;

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
    public get translateService(): TranslateAdapter {
        return this._translateService;
    }

    public async getExportedFieldsKeys(): Promise<string[]> {
        return [];
    }

    public async getExportedFields(value: T, lang?: string): Promise<any[]> {
        return [];
    }
}

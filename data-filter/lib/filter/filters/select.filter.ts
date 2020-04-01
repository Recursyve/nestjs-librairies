import { FilterType } from "../type";
import { SelectOperators } from "../operators";
import { BaseFilterDefinition, Filter } from "./filter";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { Users } from "@recursyve/nestjs-access-control";

export interface SelectFilterValue {
    id: number | string;
    name: string;
}

export interface SelectFilterDefinition<T> {
    values: (value: unknown) => Promise<SelectFilterValue[]>;
    lazyLoading?: boolean;
    getResourceById?: (id: number) => Promise<SelectFilterValue>;
}

export class SelectFilter<T> extends Filter implements SelectFilterDefinition<T> {
    public type = FilterType.Select;
    public operators = [...SelectOperators];
    public values: (value: unknown, user?: Users) => Promise<SelectFilterValue[]>;
    public getResourceById: (id: number, user?: Users) => Promise<SelectFilterValue>;
    public lazyLoading;

    constructor(definition: BaseFilterDefinition & SelectFilterDefinition<T>) {
        super(definition);

        if (this.lazyLoading === undefined) {
            this.lazyLoading = true;
        }
    }

    public async getConfig(key: string, user?: Users): Promise<FilterBaseConfigurationModel> {
        const config = await super.getConfig(key, user);
        return {
            ...config,
            values: this.lazyLoading ? [] : await this.values(null, user),
            lazyLoading: this.lazyLoading
        };
    }
}

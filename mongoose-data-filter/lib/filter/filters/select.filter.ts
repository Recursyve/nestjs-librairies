import { DataFilterUserModel } from "../../models/user.model";
import { FilterType } from "../type";
import { SelectOperators } from "../operators";
import { BaseFilterDefinition, Filter } from "./filter";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";
import { RequestInfo } from "../types/request-info.type";

export interface SelectFilterValue {
    id: number | string;
    name: string;
}

export interface SelectFilterGetValuesOptions<T = any, User = any, Request = any> {
    value: T;
    user?: User;
    request?: Request;
}

export interface SelectFilterGetResourceOptions<User = any, Request = any> {
    id: number | string;
    user?: User;
    request?: Request;
}

export interface SelectFilterDefinition<T> {
    values: ({ value, user, request }: SelectFilterGetValuesOptions) => Promise<SelectFilterValue[]>;
    lazyLoading?: boolean;
    getResourceById?: ({ id, user, request }: SelectFilterGetResourceOptions) => Promise<SelectFilterValue>;
}

export class SelectFilter<T> extends Filter implements SelectFilterDefinition<T> {
    public type = FilterType.Select;
    public operators = [...SelectOperators];
    public values: ({ value, user, request }: SelectFilterGetValuesOptions) => Promise<SelectFilterValue[]>;
    public getResourceById: ({ id, user, request }: SelectFilterGetResourceOptions) => Promise<SelectFilterValue>;
    public lazyLoading;

    constructor(definition: BaseFilterDefinition & SelectFilterDefinition<T>) {
        super(definition);

        if (this.lazyLoading === undefined) {
            this.lazyLoading = true;
        }
    }

    public async getConfig<Request>(key: string, requestInfo: RequestInfo): Promise<FilterBaseConfigurationModel> {
        const config = await super.getConfig(key, requestInfo);
        return {
            ...config,
            values: this.lazyLoading ? [] : await this.values({ value: null, ...requestInfo }),
            lazyLoading: this.lazyLoading
        };
    }
}
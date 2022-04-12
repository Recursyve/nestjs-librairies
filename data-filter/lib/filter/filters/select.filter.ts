import { DataFilterUserModel } from "../..";
import { FilterType } from "../type";
import { SelectOperators } from "../operators";
import { BaseFilterDefinition, Filter } from "./filter";
import { FilterBaseConfigurationModel } from "../models/filter-configuration.model";

export interface SelectFilterValue {
    id: number | string;
    name: string;
}

export interface SelectFilterGetValuesOptions<T = any, User = any, Request = any> {
    value: T;
    user?: User;
    req?: Request
}

export interface SelectFilterGetResourceOptions<User = any, Request = any> {
    id: number | string;
    user?: User;
    req?: Request
}

export interface SelectFilterDefinition<T> {
    values: ({ value, user, req }: SelectFilterGetValuesOptions) => Promise<SelectFilterValue[]>;
    lazyLoading?: boolean;
    getResourceById?: ({ id, user, req }: SelectFilterGetResourceOptions) => Promise<SelectFilterValue>;
}

export class SelectFilter<T> extends Filter implements SelectFilterDefinition<T> {
    public type = FilterType.Select;
    public operators = [...SelectOperators];
    public values: ({ value, user, req }: SelectFilterGetValuesOptions) => Promise<SelectFilterValue[]>;
    public getResourceById: ({ id, user, req }: SelectFilterGetResourceOptions) => Promise<SelectFilterValue>;
    public lazyLoading;

    constructor(definition: BaseFilterDefinition & SelectFilterDefinition<T>) {
        super(definition);

        if (this.lazyLoading === undefined) {
            this.lazyLoading = true;
        }
    }

    public async getConfig<Request>(key: string, req: Request, user?: DataFilterUserModel): Promise<FilterBaseConfigurationModel> {
        if (this.private) {
            return;
        }

        const config = await super.getConfig(key, req, user);
        return {
            ...config,
            values: this.lazyLoading ? [] : await this.values({ value: null, user, req }),
            lazyLoading: this.lazyLoading
        };
    }
}

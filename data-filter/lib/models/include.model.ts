import { FindAttributeOptions, Order, WhereOptions } from "sequelize";

export interface IncludeWhereModel {
    [key: string]: (option?) => unknown;
}

export interface IncludeConfig {
    path: string;
    attributes?: FindAttributeOptions;
    searchableAttributes?: string[];
    ignoreInSearch?: boolean;
    order?: Order;
    where?: IncludeWhereModel;
    required?: boolean;
    separate?: boolean;
    paranoid?: boolean;
    subQuery?: boolean;
}

export interface IncludeModel {
    path: string;
    attributes?: FindAttributeOptions;
    searchableAttributes?: string[];
    ignoreInSearch?: boolean;
    order?: Order;
    where?: WhereOptions;
    required?: boolean;
    separate?: boolean;
    paranoid?: boolean;
    subQuery?: boolean;
}

import { FindAttributeOptions, WhereOptions } from "sequelize";

export interface IncludeWhereModel {
    [key: string]: (option?) => unknown;
}

export interface IncludeConfig {
    path: string;
    attributes?: FindAttributeOptions;
    searchableAttributes?: string[];
    ignoreInSearch?: boolean;
    where?: IncludeWhereModel;
    required?: boolean;
}

export interface IncludeModel {
    path: string;
    attributes?: FindAttributeOptions;
    searchableAttributes?: string[];
    ignoreInSearch?: boolean;
    where?: WhereOptions;
    required?: boolean;
}

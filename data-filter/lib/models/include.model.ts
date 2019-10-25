import { FindAttributeOptions, WhereOptions } from "sequelize";

export interface IncludeWhereModel {
    [key: string]: (option?) => unknown;
}

export interface IncludeConfig {
    path: string;
    attributes?: FindAttributeOptions;
    where?: IncludeWhereModel;
    required?: boolean;
}

export interface IncludeModel {
    path: string;
    attributes?: FindAttributeOptions;
    where?: WhereOptions;
    required?: boolean;
}

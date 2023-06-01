export interface IncludeWhereModel {
    [key: string]: (option?) => unknown;
}

export interface IncludeConfig {
    path: string;
}

export interface IncludeModel {
    path: string;
}

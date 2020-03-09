import { QueryModel } from "../filter/models/query.model";

export interface FilterPageMode {
    number: number;
    size: number;
}

export interface FilterSearchModel {
    value: string;
}

export interface OrderModel {
    column: string;
    direction: "asc" | "desc" | "";
}

export interface FilterQueryModel {
    page?: FilterPageMode;
    search?: FilterSearchModel;
    query?: QueryModel;
    order?: OrderModel;
    data?: object;
}

export interface FilterResultModel<T> {
    values: T[];
    total: number;
    page?: {
        number: number;
        size: number;
    };
}

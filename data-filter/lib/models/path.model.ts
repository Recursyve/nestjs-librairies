import { Order, WhereOptions } from "sequelize";
import { IncludeWhereModel } from "./include.model";

export interface PathConfig {
    path: string;
    where?: IncludeWhereModel;
    required?: boolean;
    separate?: boolean;
    paranoid?: boolean;
    subQuery?: boolean;
    order?: Order;
    limit?: number;
}


export interface PathModel {
    path: string;
    where?: WhereOptions;
    required?: boolean;
    separate?: boolean;
    paranoid?: boolean;
    subQuery?: boolean;
    order?: Order;
    limit?: number;
}

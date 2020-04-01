import { WhereOptions } from "sequelize";
import { IncludeWhereModel } from "./include.model";

export interface PathConfig {
    path: string;
    where?: IncludeWhereModel;
    required?: boolean;
}


export interface PathModel {
    path: string;
    where?: WhereOptions;
    required?: boolean;
}

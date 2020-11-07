import { FilterQuery } from "mongoose";
import { IncludeWhereModel } from "./include.model";

export interface PathConfig {
    path: string;
    where?: IncludeWhereModel;
}


export interface PathModel {
    path: string;
    where?: FilterQuery<any>;
}

import { ProjectionAlias } from "sequelize";
import { GroupOption } from "sequelize/types/model";
import { PathModel } from "./path.model";

export interface CustomAttributesConfig<T = any> {
    key: string;
    type: string;
    config?: T;

    transform(options?: object, path?: string): string | ProjectionAlias;
    groupBy(): GroupOption;
}

export interface CustomAttributesModel {
    key: string;
    attribute: string | ProjectionAlias;
    path?: PathModel;
}

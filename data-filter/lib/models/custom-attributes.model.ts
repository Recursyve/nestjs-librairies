import { ProjectionAlias } from "sequelize";
import { PathModel } from "./path.model";

export interface CustomAttributesConfig<T = any> {
    key: string;
    type: string;
    config?: T;

    transform(options?: object, path?: string): string | ProjectionAlias;
}

export interface CustomAttributesModel {
    key: string;
    attribute: string | ProjectionAlias;
    path?: PathModel;
}

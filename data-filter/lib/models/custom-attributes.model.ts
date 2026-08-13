import { ProjectionAlias } from "sequelize";
import { Model } from "sequelize-typescript";
import { IncludeWhereModel } from "./include.model";
import { PathModel } from "./path.model";

export interface CustomAttributesOptionConfig {
    name: string;
    path?: string;
    where?: IncludeWhereModel;
}

export interface CustomAttributesConfig<T extends CustomAttributesOptionConfig = CustomAttributesOptionConfig> {
    key: string;
    type: string;
    config?: T;

    transform(options?: object, path?: string, model?: typeof Model): string | ProjectionAlias | null;
    shouldGroupBy(): boolean;
}

export interface CustomAttributesModel {
    key: string;
    attribute: string | ProjectionAlias;
    path?: PathModel;
}

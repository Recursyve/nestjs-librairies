import { ProjectionAlias } from "sequelize";
import { GroupOption } from "sequelize/types/model";
import { DialectFormatterService } from "../services/dialect-formatter.service";
import { IncludeWhereModel } from "./include.model";
import { PathModel } from "./path.model";

export interface CustomAttributesOptionConfig {
    name: string;
    path?: string;
    where?: IncludeWhereModel;
}

export interface CustomAttributesConfig<T extends CustomAttributesOptionConfig = CustomAttributesOptionConfig, context = CustomAttributesContext> {
    key: string;
    type: string;
    config?: T;

    withContext(dialectFormatterService: DialectFormatterService): context;
    shouldGroupBy(): boolean;
}

export abstract class CustomAttributesContext {
    public abstract transform(options?: object, path?: string): string | ProjectionAlias;
}

export interface CustomAttributesModel {
    key: string;
    attribute: string | ProjectionAlias;
    path?: PathModel;
}

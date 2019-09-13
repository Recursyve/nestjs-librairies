import { FindAttributeOptions } from "sequelize";
import { PathModel } from "./path.model";

export interface DefinitionModel {
    key: string;
    path?: PathModel;
    attributes?: FindAttributeOptions;
}

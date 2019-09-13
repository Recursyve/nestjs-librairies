import { FindAttributeOptions } from "sequelize";

export interface AttributesModel {
    key: string;
    attributes?: FindAttributeOptions;
}

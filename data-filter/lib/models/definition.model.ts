import type { FindAttributeOptions } from "sequelize";

import type { PathModel } from "./path.model";

export interface DefinitionModel {
    key: string;
    path?: PathModel;
    attributes?: FindAttributeOptions;
}

import { WhereOptions } from "sequelize";

export interface PathModel {
    path: string;
    where?: WhereOptions;
    required?: boolean;
}

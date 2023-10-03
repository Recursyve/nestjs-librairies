import { SequelizeEntitiesAttributes } from "./sequelize-entities.model";

export type SequelizeAttributes<CreateAttributes> = Partial<CreateAttributes> & SequelizeEntitiesAttributes;

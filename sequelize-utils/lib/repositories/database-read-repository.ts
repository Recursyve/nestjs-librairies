import { CountOptions, FindOptions, Identifier } from "sequelize";
import { SequelizeEntities } from "../models/sequelize-entities.model";

export class SequelizeReadRepository<T extends SequelizeEntities> {
    constructor(protected repository: typeof SequelizeEntities) {}

    public findByPk(identifier: Identifier, options?: FindOptions): Promise<T | null> {
        return this.repository.findByPk(identifier, options) as unknown as Promise<T | null>;
    }

    public findOne(options?: FindOptions): Promise<T | null> {
        return this.repository.findOne(options) as unknown as Promise<T | null>;
    }

    public findAll(options?: FindOptions): Promise<T[]> {
        return this.repository.findAll(options) as unknown as Promise<T[]>;
    }

    public count(options?: CountOptions): Promise<number> {
        return this.repository.count(options);
    }
}

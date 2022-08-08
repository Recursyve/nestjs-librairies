import { CountOptions, FindOptions, Identifier } from "sequelize";
import { DatabaseEntities } from "../models/database-entities.model";

export class SequelizeReadRepository<T extends DatabaseEntities> {
    constructor(protected repository: typeof DatabaseEntities) {}

    public findByPk(identifier: Identifier, options?: FindOptions): Promise<T> {
        return this.repository.findByPk(identifier, options) as unknown as Promise<T>;
    }

    public findOne(options?: FindOptions): Promise<T> {
        return this.repository.findOne(options) as unknown as Promise<T>;
    }

    public findAll(options?: FindOptions): Promise<T[]> {
        return this.repository.findAll(options) as unknown as Promise<T[]>;
    }

    public count(options?: CountOptions): Promise<number> {
        return this.repository.count(options);
    }
}

import type { CountOptions, FindOptions, Identifier, ModelStatic } from "sequelize";
import type { Attributes } from "sequelize/types/model";

import type { SequelizeEntities } from "../models/sequelize-entities.model";

export abstract class SequelizeReadRepository<T extends SequelizeEntities<object, object>> {
    protected abstract repository: ModelStatic<T>;

    public async findByPk(
        identifier: Identifier,
        options?: Omit<FindOptions<Attributes<T>>, "where">
    ): Promise<T | null> {
        return this.repository.findByPk(identifier, options);
    }

    public async findOne(options?: FindOptions<Attributes<T>>): Promise<T | null> {
        return this.repository.findOne(options);
    }

    public async findAll(options?: FindOptions<Attributes<T>>): Promise<T[]> {
        return this.repository.findAll(options);
    }

    public async count(options?: Omit<CountOptions<Attributes<T>>, "group">): Promise<number> {
        return this.repository.count(options);
    }
}

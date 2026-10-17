import type {
    Attributes,
    BulkCreateOptions,
    CreateOptions,
    CreationAttributes,
    DestroyOptions,
    FindOrCreateOptions,
    Identifier,
    UpdateOptions,
    WhereOptions
} from "sequelize";

import type { SequelizeEntities } from "../models/sequelize-entities.model";
import { SequelizeReadRepository } from "./database-read-repository";

/**
 * @deprecated You should create your own functions instead
 */
export abstract class SequelizeRepository<
    T extends SequelizeEntities<object, object>,
    CreateDto extends CreationAttributes<T> = CreationAttributes<T>,
    UpdateDto extends Partial<Attributes<T>> = Partial<Attributes<T>>
> extends SequelizeReadRepository<T> {
    public async create(dto: CreateDto, options?: CreateOptions<Attributes<T>>): Promise<T> {
        return this.repository.create(dto, options);
    }

    public async bulkCreate(dto: CreateDto[], options?: BulkCreateOptions<Attributes<T>>): Promise<T[]> {
        return this.repository.bulkCreate(dto, options);
    }

    public async findOrCreate(
        options: FindOrCreateOptions<Attributes<T>, CreationAttributes<T>>
    ): Promise<[T, boolean]> {
        return this.repository.findOrCreate(options);
    }

    public async updateByPk(
        identifier: Identifier,
        dto: UpdateDto,
        options?: UpdateOptions<Attributes<T>>
    ): Promise<T | null> {
        await this.repository.update(dto, {
            where: { [this.repository.primaryKeyAttribute]: identifier } as WhereOptions<Attributes<T>>,
            ...options
        });
        return this.findByPk(identifier, { transaction: options?.transaction });
    }

    public async update(dto: UpdateDto, options: UpdateOptions<Attributes<T>>): Promise<void> {
        await this.repository.update(dto, options);
    }

    public async destroyByPk(
        identifier: Identifier,
        options?: Omit<DestroyOptions<Attributes<T>>, "where">
    ): Promise<void> {
        await this.repository.destroy({
            where: { [this.repository.primaryKeyAttribute]: identifier } as WhereOptions<Attributes<T>>,
            ...options
        });
    }

    public async destroy(options?: DestroyOptions<Attributes<T>>): Promise<void> {
        await this.repository.destroy(options);
    }
}

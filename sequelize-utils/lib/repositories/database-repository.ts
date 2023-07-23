import { Attributes, BulkCreateOptions, CreateOptions, DestroyOptions, FindOrCreateOptions, Identifier, UpdateOptions } from "sequelize";
import { SequelizeEntities } from "../models/sequelize-entities.model";
import { SequelizeReadRepository } from "./database-read-repository";

export class SequelizeRepository<T extends SequelizeEntities, CreateDto = T, UpdateDto = T> extends SequelizeReadRepository<T> {
    constructor(repository: typeof SequelizeEntities) {
        super(repository);
    }

    public create<Options>(dto: CreateDto | Partial<T>, options?: Options & CreateOptions<Attributes<T>>): Promise<T> {
        return this.repository.create(dto as any, options) as unknown as Promise<T>;
    }

    public bulkCreate<Options>(dto: (CreateDto | Partial<T>)[], options?: Options & BulkCreateOptions<Attributes<T>>): Promise<T[]> {
        return this.repository.bulkCreate(dto as any, options as any) as unknown as Promise<T[]>;
    }

    public findOrCreate<Options>(options: FindOrCreateOptions, args?: Options): Promise<[T, boolean]> {
        return (this.repository.findOrCreate(options)) as Promise<[T, boolean]>;
    }

    public async updateByPk<Options>(identifier: Identifier, dto: UpdateDto | Partial<T>, options?: Options & UpdateOptions<Attributes<T>>): Promise<T | null> {
         await this.repository.update(dto, {
            where: {
                [this.repository.primaryKeyAttribute]: identifier
            },
            ...options as unknown as any
        });
        return this.findByPk(identifier);
    }

    public async update<Options>(dto: UpdateDto | Partial<T>, options?: Options & UpdateOptions<Attributes<T>>): Promise<void> {
        await this.repository.update(dto, options as any);
    }

    public async destroyByPk(identifier: Identifier, options?: Omit<DestroyOptions, "where">): Promise<void> {
        await this.repository.destroy({
            where: {
                [this.repository.primaryKeyAttribute]: identifier
            },
            ...(options ?? {})
        });
    }

    public async destroy(options?: DestroyOptions): Promise<void> {
        await this.repository.destroy(options);
    }
}

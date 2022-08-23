import { DestroyOptions, FindOrCreateOptions, Identifier, UpdateOptions } from "sequelize";
import { SequelizeEntities } from "../models/sequelize-entities.model";
import { SequelizeReadRepository } from "./database-read-repository";

export class SequelizeRepository<T extends SequelizeEntities, CreateDto = T, UpdateDto = T> extends SequelizeReadRepository<T> {
    constructor(repository: typeof SequelizeEntities) {
        super(repository);
    }

    public create<Options>(dto: CreateDto | Partial<T>, options?: Options);
    public create<Options>(dto: CreateDto | Partial<T>, options: Options);
    public create<Options>(dto: CreateDto | Partial<T>): Promise<T> {
        return this.repository.create(dto as any) as Promise<T>;
    }

    public findOrCreate<Options>(options: FindOrCreateOptions, args?: Options): Promise<[T, boolean]>;
    public findOrCreate<Options>(options: FindOrCreateOptions, args: Options) : Promise<[T, boolean]>;
    public findOrCreate<Options>(options: FindOrCreateOptions): Promise<[T, boolean]> {
        return (this.repository.findOrCreate(options)) as Promise<[T, boolean]>;
    }

    public async updateByPk<Options>(identifier: Identifier, dto: UpdateDto | Partial<T>, options?: Options): Promise<T>;
    public async updateByPk<Options>(identifier: Identifier, dto: UpdateDto | Partial<T>, options: Options): Promise<T>;
    public async updateByPk<Options>(identifier: Identifier, dto: UpdateDto | Partial<T>): Promise<T> {
        const [, entities] = await this.repository.update(dto, {
            where: {
                [this.repository.primaryKeyAttribute]: identifier
            },
            returning: true
        });
        return entities[0] as unknown as T;
    }

    public async update<Options>(dto: UpdateDto | Partial<T>, options?: Options & UpdateOptions): Promise<void> {
        await this.repository.update(dto, options);
    }

    public async destroyByPk(identifier: Identifier): Promise<void> {
        await this.repository.destroy({
            where: {
                [this.repository.primaryKeyAttribute]: identifier
            }
        });
    }

    public async destroy(options?: DestroyOptions): Promise<void> {
        await this.repository.destroy(options);
    }
}

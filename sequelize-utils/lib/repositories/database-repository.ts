import { DestroyOptions, Identifier, UpdateOptions } from "sequelize";
import { SequelizeEntities } from "../models/sequelize-entities.model";
import { SequelizeReadRepository } from "./database-read-repository";

export class SequelizeRepository<T extends SequelizeEntities, CreateDto = T, UpdateDto = T> extends SequelizeReadRepository<T> {
    constructor(repository: typeof SequelizeEntities) {
        super(repository);
    }

    public create(dto: CreateDto | Partial<T>): Promise<T> {
        return this.repository.create(dto as any) as Promise<T>;
    }

    public async updateByPk(identifier: Identifier, dto: UpdateDto | Partial<T>): Promise<void> {
        await this.repository.update(dto, {
            where: {
                [this.repository.primaryKeyAttribute]: identifier
            }
        });
    }

    public async update(dto: UpdateDto | Partial<T>, options?: UpdateOptions): Promise<void> {
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

import { ResourceAccessControlService, Resources } from "@recursyve/nestjs-access-control";
import { SequelizeEntities } from "@recursyve/nestjs-sequelize-utils";
import { Attributes, FindOptions, Identifier, Op, WhereOptions } from "sequelize";

export class AccessControlRepository<T extends SequelizeEntities> extends ResourceAccessControlService {
    constructor(protected repository: typeof SequelizeEntities<any, any>) {
        super({ model: repository, type: "sequelize" });
    }

    public async findByPkFromUser(
        identifier: Identifier,
        resources: Resources,
        options?: FindOptions<Attributes<T>>
    ): Promise<T> {
        const where = {
            [this.repository.primaryKeyAttribute]: identifier
        };

        return this.findOneForUser(resources, {
            ...options,
            where: options?.where ? { [Op.and]: [where, options.where] } : options?.where
        });
    }

    public async findOneForUser(resources: Resources, options?: FindOptions<Attributes<T>>): Promise<T> {
        const where = await this.generateAccessControlWhereOptions(resources, options?.where);

        return this.repository.findOne({
            ...options,
            where
        }) as unknown as T;
    }

    public async findAllFromUser(resources: Resources, options?: FindOptions<Attributes<T>>): Promise<T[]> {
        return this.repository.findAll({
            ...options,
            where: await this.generateAccessControlWhereOptions(resources, options?.where)
        }) as unknown as Promise<T[]>;
    }

    public async countForUser(resources: Resources, options?: FindOptions<Attributes<T>>): Promise<number> {
        const where = await this.generateAccessControlWhereOptions(resources, options?.where);

        return this.repository.count({
            ...options,
            where
        });
    }

    public async generateAccessControlWhereOptions(
        resources: Resources,
        where?: WhereOptions<T>
    ): Promise<WhereOptions> {
        if (resources.ids) {
            if (!where) {
                return { id: resources.ids };
            }

            return { [Op.and]: [where, { id: resources.ids }] };
        } else if (resources.where) {
            if (!where) {
                return resources.where;
            }

            return [resources.where, where];
        } else if (resources.all) {
            return where;
        }

        // TODO: we would return some kind of condition that is always `false`.
        return {};
    }
}

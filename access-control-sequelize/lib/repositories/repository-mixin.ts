import { Inject, mixin } from "@nestjs/common";
import { ResourceAccessControlService, Users } from "@recursyve/nestjs-access-control";
import { DatabaseEntities, SequelizeReadRepository, SequelizeRepository } from "@recursyve/nestjs-sequelize-utils";
import { FindOptions, Identifier, Op, WhereOptions } from "sequelize";
import { AbstractConstructor, Constructor } from "../utils/contructor";

export interface AccessControlRepositoryDefinition<T> {
    findByPkFromUser(identifier: Identifier, user: Users, options?: FindOptions): Promise<T>;
    findOneForUser(user: Users, options?: FindOptions): Promise<T>;
    findAllFromUser(user: Users, options?: FindOptions): Promise<T[]>;
    countForUser(user: Users, options?: FindOptions): Promise<number>;
}

type AccessControlRepositoryDefinitionCtor<T>
    = Constructor<AccessControlRepositoryDefinition<T>>
    & AbstractConstructor<AccessControlRepositoryDefinition<T>>;

export interface HasAccessControlRepositoryDefinition {}

export const mixinAccessControlRepository = <T>() => {
    return function mixinAccessControlRepository<C extends Constructor<HasAccessControlRepositoryDefinition>>(
        base: C,
    ): AccessControlRepositoryDefinitionCtor<T> & C {
        class Repository extends base {
            private repository: typeof DatabaseEntities;

            // @ts-ignore
            @Inject()
            protected resourceAccessControlService: ResourceAccessControlService;

            constructor(...args: any[]) {
                super(...args);

                this.repository = this["repository"];
            }

            public async findByPkFromUser(identifier: Identifier, user: Users, options?: FindOptions): Promise<T> {
                const resources = await this.resourceAccessControlService.getResources(user);
                if (resources.ids) {
                    if (!resources.ids.some((resourceId) => resourceId === identifier)) {
                        return null;
                    }

                    return this.repository.findByPk(identifier, options) as unknown as T;
                }

                if (resources.where) {
                    if (!options) {
                        options = {};
                    }

                    if (options.where) {
                        options.where = {
                            [Op.and]: [options.where, resources.where]
                        }
                    } else {
                        options.where = resources.where;
                    }
                }

                return this.repository.findByPk(identifier, options) as unknown as T;
            }

            public async findOneForUser(user: Users, options?: FindOptions): Promise<T> {
                const where = await this.mergeAccessControlCondition(options?.where ?? {}, user);

                return this.repository.findOne({
                    ...options,
                    where
                }) as unknown as T;
            }

            public async findAllFromUser(user: Users, options?: FindOptions): Promise<T[]> {
                if (!options) {
                    options = {};
                }
                return this.repository.findAll({
                    ...options,
                    where: await this.mergeAccessControlCondition(options.where, user)
                }) as unknown as Promise<T[]>;
            }

            public async countForUser(user: Users, options?: FindOptions): Promise<number> {
                const where = await this.mergeAccessControlCondition(options?.where ?? {}, user);

                return this.repository.count({
                    ...options,
                    where
                });
            }

            private async mergeAccessControlCondition(where: WhereOptions, user: Users): Promise<WhereOptions> {
                const resources = await this.resourceAccessControlService.getResources(user);
                if (resources.ids) {
                    return {
                        [Op.and]: [where, { id: resources.ids }]
                    };
                } else if (resources.where) {
                    return where ? {
                        [Op.and]: [where, resources.where]
                    } : resources.where;
                }

                return where;
            }
        }

        return mixin(Repository) as any;
    }
}

export const _SequelizeAccessControlRepository = <T extends DatabaseEntities>() => mixinAccessControlRepository<T>()(
    class extends SequelizeRepository<T> {
        constructor(repository: typeof DatabaseEntities) {
            super(repository);
        }
    }
)

export const _SequelizeAccessControlReadRepository = <T extends DatabaseEntities>() => mixinAccessControlRepository<T>()(
    class extends SequelizeReadRepository<T> {
        constructor(repository: typeof DatabaseEntities) {
            super(repository);
        }
    }
)

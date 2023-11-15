import { Inject } from "@nestjs/common";
import { AccessControlRepository } from "./access-control.repository";
import { AccessControlService, Users } from "@recursyve/nestjs-access-control";
import { SequelizeEntities, SequelizeReadRepository } from "@recursyve/nestjs-sequelize-utils";
import { FindOptions, Identifier } from "sequelize";

export abstract class SequelizeAccessControlReadRepository<T extends SequelizeEntities> extends SequelizeReadRepository<T> {
    @Inject()
    protected accessControlService: AccessControlService;

    protected readonly accessControlRepository: AccessControlRepository<T>;

    protected constructor(repository: typeof SequelizeEntities<any, any>) {
        super();

        this.accessControlRepository = new AccessControlRepository(repository);
    }

    public async findByPkFromUser(identifier: Identifier, user: Users, options?: FindOptions): Promise<T> {
        const resources = await this.accessControlService.forModel(this.repository).getResources(user);
        return this.accessControlRepository.findByPkFromUser(identifier, resources, options);
    }

    public async findOneForUser(user: Users, options?: FindOptions): Promise<T> {
        const resources = await this.accessControlService.forModel(this.repository).getResources(user);
        return this.accessControlRepository.findOneForUser(resources, options);
    }

    public async findAllFromUser(user: Users, options?: FindOptions): Promise<T[]> {
        const resources = await this.accessControlService.forModel(this.repository).getResources(user);
        return this.accessControlRepository.findAllFromUser(resources, options);
    }

    public async countForUser(user: Users, options?: FindOptions): Promise<number> {
        const resources = await this.accessControlService.forModel(this.repository).getResources(user);
        return this.accessControlRepository.countForUser(resources, options);
    }
}

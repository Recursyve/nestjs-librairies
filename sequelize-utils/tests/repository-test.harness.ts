import type { ModelStatic } from "sequelize";

import type { SequelizeEntitiesAttributes } from "../lib/index";
import { SequelizeEntities, SequelizeReadRepository, SequelizeRepository } from "../lib/index";
import type { ModelRepositoryMock } from "./repository.mock";
import { asSequelizeModelRepository, createModelRepositoryMock } from "./repository.mock";

interface RepositoryTestEntityAttributes extends SequelizeEntitiesAttributes {
    name?: string;
}

export class RepositoryTestEntity extends SequelizeEntities<RepositoryTestEntityAttributes> {}

export class TestReadRepository extends SequelizeReadRepository<RepositoryTestEntity> {
    public repository: ModelStatic<RepositoryTestEntity> =
        asSequelizeModelRepository<RepositoryTestEntity>(createModelRepositoryMock());
}

/* eslint-disable @typescript-eslint/no-deprecated -- harness for deprecated repository tests */
export class TestRepository extends SequelizeRepository<RepositoryTestEntity> {
    public repository: ModelStatic<RepositoryTestEntity> =
        asSequelizeModelRepository<RepositoryTestEntity>(createModelRepositoryMock());
}

export function createReadRepositoryHarness(): {
    model: ModelRepositoryMock;
    repository: TestReadRepository;
} {
    const model = createModelRepositoryMock();
    const repository = new TestReadRepository();
    repository.repository = asSequelizeModelRepository<RepositoryTestEntity>(model);

    return { model, repository };
}

export function createRepositoryHarness(): {
    model: ModelRepositoryMock;
    repository: TestRepository;
} {
    const model = createModelRepositoryMock();
    const repository = new TestRepository();
    repository.repository = asSequelizeModelRepository<RepositoryTestEntity>(model);

    return { model, repository };
}

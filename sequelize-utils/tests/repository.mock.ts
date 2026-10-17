import type { ModelStatic } from "sequelize";
import { vi } from "vitest";

import type { SequelizeEntities } from "../lib/index";

export interface ModelRepositoryMock {
    findByPk: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    bulkCreate: ReturnType<typeof vi.fn>;
    findOrCreate: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    primaryKeyAttribute: string;
}

export function createModelRepositoryMock(): ModelRepositoryMock {
    return {
        findByPk: vi.fn(),
        findOne: vi.fn(),
        findAll: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        bulkCreate: vi.fn(),
        findOrCreate: vi.fn(),
        update: vi.fn(),
        destroy: vi.fn(),
        primaryKeyAttribute: "id"
    };
}

export function asSequelizeModelRepository<T extends SequelizeEntities<object, object>>(
    mock: ModelRepositoryMock
): ModelStatic<T> {
    return mock as unknown as ModelStatic<T>;
}

import { beforeEach, describe, expect, it } from "vitest";

import type { TestReadRepository } from "../../tests/repository-test.harness";
import { createReadRepositoryHarness } from "../../tests/repository-test.harness";
import type { ModelRepositoryMock } from "../../tests/repository.mock";
import { SequelizeReadRepository } from "./database-read-repository";

describe(SequelizeReadRepository, () => {
    let underTest: TestReadRepository;
    let model: ModelRepositoryMock;

    beforeEach(() => {
        ({ model, repository: underTest } = createReadRepositoryHarness());
    });

    describe("count", () => {
        beforeEach(() => {
            model.count.mockResolvedValue(2);
        });

        it("calls count on the model", async () => {
            expect.assertions(1);

            await underTest.count({ where: { id: 1 } });

            expect(model.count).toHaveBeenCalledWith({ where: { id: 1 } });
        });
    });

    describe("findAll", () => {
        beforeEach(() => {
            model.findAll.mockResolvedValue([]);
        });

        it("calls findAll on the model", async () => {
            expect.assertions(1);

            await underTest.findAll();

            expect(model.findAll).toHaveBeenCalledWith(undefined);
        });
    });

    describe("findByPk", () => {
        beforeEach(() => {
            model.findByPk.mockResolvedValue({ id: 1 });
        });

        it("calls findByPk on the model", async () => {
            expect.assertions(1);

            await underTest.findByPk(1, { transaction: undefined });

            expect(model.findByPk).toHaveBeenCalledWith(1, { transaction: undefined });
        });
    });

    describe("findOne", () => {
        beforeEach(() => {
            model.findOne.mockResolvedValue(null);
        });

        it("calls findOne on the model", async () => {
            expect.assertions(1);

            await underTest.findOne({ where: { id: 1 } });

            expect(model.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        });
    });
});

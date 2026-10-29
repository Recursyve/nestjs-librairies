import { beforeEach, describe, expect, it } from "vitest";

import type { RepositoryTestEntity, TestRepository } from "../../tests/repository-test.harness";
import { createRepositoryHarness } from "../../tests/repository-test.harness";
import type { ModelRepositoryMock } from "../../tests/repository.mock";
import { SequelizeRepository } from "./database-repository";

// eslint-disable-next-line @typescript-eslint/no-deprecated
describe(SequelizeRepository, () => {
    let underTest: TestRepository;
    let model: ModelRepositoryMock;

    beforeEach(() => {
        ({ model, repository: underTest } = createRepositoryHarness());
    });

    describe("bulkCreate", () => {
        beforeEach(() => {
            model.bulkCreate.mockResolvedValue([]);
        });

        it("calls bulkCreate on the model", async () => {
            expect.assertions(1);

            await underTest.bulkCreate([{ name: "a" }, { name: "b" }]);

            expect(model.bulkCreate).toHaveBeenCalledWith([{ name: "a" }, { name: "b" }], undefined);
        });
    });

    describe("create", () => {
        beforeEach(() => {
            model.create.mockResolvedValue({ id: 1 });
        });

        it("calls create on the model", async () => {
            expect.assertions(1);

            await underTest.create({ name: "test" });

            expect(model.create).toHaveBeenCalledWith({ name: "test" }, undefined);
        });
    });

    describe("destroy", () => {
        it("calls destroy on the model", async () => {
            expect.assertions(1);

            await underTest.destroy({ where: { id: 4 } });

            expect(model.destroy).toHaveBeenCalledWith({ where: { id: 4 } });
        });
    });

    describe("destroyByPk", () => {
        it("calls destroy on the model with the primary key", async () => {
            expect.assertions(1);

            await underTest.destroyByPk(3);

            expect(model.destroy).toHaveBeenCalledWith({ where: { id: 3 } });
        });
    });

    describe("findOrCreate", () => {
        beforeEach(() => {
            model.findOrCreate.mockResolvedValue([{ id: 1 } as RepositoryTestEntity, true]);
        });

        it("calls findOrCreate on the model", async () => {
            expect.assertions(1);

            await underTest.findOrCreate({ where: { id: 1 } });

            expect(model.findOrCreate).toHaveBeenCalledWith({ where: { id: 1 } });
        });
    });

    describe("update", () => {
        it("calls update on the model", async () => {
            expect.assertions(1);

            await underTest.update({ name: "patch" }, { where: { id: 2 } });

            expect(model.update).toHaveBeenCalledWith({ name: "patch" }, { where: { id: 2 } });
        });
    });

    describe("updateByPk", () => {
        beforeEach(() => {
            model.update.mockResolvedValue([1]);
            model.findByPk.mockResolvedValue({ id: 7 });
        });

        it("calls update on the model with the primary key", async () => {
            expect.assertions(1);

            await underTest.updateByPk(7, { name: "updated" });

            expect(model.update).toHaveBeenCalledWith({ name: "updated" }, { where: { id: 7 } });
        });

        it("reloads the entity with findByPk", async () => {
            expect.assertions(1);

            await underTest.updateByPk(7, { name: "updated" });

            expect(model.findByPk).toHaveBeenCalledWith(7, { transaction: undefined });
        });
    });
});

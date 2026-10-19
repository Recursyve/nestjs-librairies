import type { Sequelize } from "sequelize-typescript";
import type { Mock } from "vitest";
import { describe, expect, it, vi, beforeEach } from "vitest";

import {
    AfterBulkCreateFormatDateOnlyHook,
    AfterCreateFormatDateOnlyHook
} from "./hooks/after-create-format-date-only.hook";
import { AfterFindFormatDateOnlyHook } from "./hooks/after-find-format-date-only.hook";
import { SequelizeUtilsModule } from "./sequelize-utils.module";

describe(SequelizeUtilsModule, () => {
    let addHook: Mock<(name: string, tag: string, hook: unknown) => void>;
    let underTest: SequelizeUtilsModule;

    beforeEach(() => {
        addHook = vi.fn<(name: string, tag: string, hook: unknown) => void>();
        underTest = new SequelizeUtilsModule({ addHook } as unknown as Sequelize);
    });

    it("registers the afterBulkCreate date-only hook", () => {
        expect.assertions(1);

        underTest.onModuleInit();

        expect(addHook).toHaveBeenCalledWith(
            "afterBulkCreate",
            "transform-date-only",
            AfterBulkCreateFormatDateOnlyHook
        );
    });

    it("registers the afterCreate date-only hook", () => {
        expect.assertions(1);

        underTest.onModuleInit();

        expect(addHook).toHaveBeenCalledWith("afterCreate", "transform-date-only", AfterCreateFormatDateOnlyHook);
    });

    it("registers the afterFind date-only hook", () => {
        expect.assertions(1);

        underTest.onModuleInit();

        expect(addHook).toHaveBeenCalledWith("afterFind", "transform-date-only", AfterFindFormatDateOnlyHook);
    });

    it("registers the afterUpdate date-only hook", () => {
        expect.assertions(1);

        underTest.onModuleInit();

        expect(addHook).toHaveBeenCalledWith("afterUpdate", "transform-date-only", AfterFindFormatDateOnlyHook);
    });
});

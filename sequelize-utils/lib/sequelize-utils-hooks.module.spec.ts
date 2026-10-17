import type { Sequelize } from "sequelize-typescript";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AfterCreateFormatDateOnlyHook } from "./hooks/after-create-format-date-only.hook";
import { AfterFindFormatDateOnlyHook } from "./hooks/after-find-format-date-only.hook";
import { SequelizeUtilsHooksModule } from "./sequelize-utils.module";

// eslint-disable-next-line @typescript-eslint/no-deprecated
describe(SequelizeUtilsHooksModule, () => {
    let addHook: Mock<(name: string, tag: string, hook: unknown) => void>;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    let underTest: SequelizeUtilsHooksModule;

    beforeEach(() => {
        addHook = vi.fn<(name: string, tag: string, hook: unknown) => void>();
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        underTest = new SequelizeUtilsHooksModule({ addHook } as unknown as Sequelize);
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
});

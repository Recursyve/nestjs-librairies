import "reflect-metadata";

import { describe, expect, it } from "vitest";

import { createDateOnlyInstance } from "../../tests/date-only.fixture";
import { AfterFindFormatDateOnlyHook } from "./after-find-format-date-only.hook";

describe("afterFindFormatDateOnlyHook", () => {
    it("does not mutate unrelated instances when the hook receives null", async () => {
        expect.assertions(1);

        const instance = createDateOnlyInstance("1990-01-01");

        await AfterFindFormatDateOnlyHook(null as never);

        expect(instance.dataValues["birthDate"]).toBe("1990-01-01");
    });

    it("formats DATEONLY values on a single instance", async () => {
        expect.assertions(1);

        const instance = createDateOnlyInstance("1990-01-01");

        await AfterFindFormatDateOnlyHook(instance as never);

        expect(instance.dataValues["birthDate"]).toBeInstanceOf(Date);
    });

    it("formats the first instance in a result set", async () => {
        expect.assertions(1);

        const first = createDateOnlyInstance("1990-01-01");
        const second = createDateOnlyInstance("1991-02-02");

        await AfterFindFormatDateOnlyHook([first, second] as never);

        expect(first.dataValues["birthDate"]).toBeInstanceOf(Date);
    });

    it("formats the second instance in a result set", async () => {
        expect.assertions(1);

        const first = createDateOnlyInstance("1990-01-01");
        const second = createDateOnlyInstance("1991-02-02");

        await AfterFindFormatDateOnlyHook([first, second] as never);

        expect(second.dataValues["birthDate"]).toBeInstanceOf(Date);
    });
});

import "reflect-metadata";

import { describe, expect, it } from "vitest";

import { createDateOnlyInstance } from "../../tests/date-only.fixture";
import { AfterBulkCreateFormatDateOnlyHook, AfterCreateFormatDateOnlyHook } from "./after-create-format-date-only.hook";

describe("afterBulkCreateFormatDateOnlyHook", () => {
    it("formats the first instance from a bulk create", async () => {
        expect.assertions(1);

        const first = createDateOnlyInstance("1990-01-01");
        const second = createDateOnlyInstance("1991-02-02");

        await AfterBulkCreateFormatDateOnlyHook([first, second] as never);

        expect(first.dataValues["birthDate"]).toBeInstanceOf(Date);
    });

    it("formats the second instance from a bulk create", async () => {
        expect.assertions(1);

        const first = createDateOnlyInstance("1990-01-01");
        const second = createDateOnlyInstance("1991-02-02");

        await AfterBulkCreateFormatDateOnlyHook([first, second] as never);

        expect(second.dataValues["birthDate"]).toBeInstanceOf(Date);
    });
});

describe("afterCreateFormatDateOnlyHook", () => {
    it("does not mutate unrelated instances when the hook receives null", async () => {
        expect.assertions(1);

        const instance = createDateOnlyInstance("1990-01-01");

        await AfterCreateFormatDateOnlyHook(null as never);

        expect(instance.dataValues["birthDate"]).toBe("1990-01-01");
    });

    it("formats DATEONLY values on the created instance", async () => {
        expect.assertions(1);

        const instance = createDateOnlyInstance("1990-01-01");

        await AfterCreateFormatDateOnlyHook(instance as never);

        expect(instance.dataValues["birthDate"]).toBeInstanceOf(Date);
    });
});

import { describe, expect, it } from "vitest";

import { TypeUtils } from "./type.utils";

describe("typeUtils", () => {
    describe("isNullOrUndefined", () => {
        it.each([null, undefined])("returns true for %j", (value) => {
            expect.assertions(1);

            expect(TypeUtils.isNullOrUndefined(value)).toBe(true);
        });

        it.each([0, "", false, {}, []])("returns false for %j", (value) => {
            expect.assertions(1);

            expect(TypeUtils.isNullOrUndefined(value)).toBe(false);
        });
    });

    describe("isNotNullOrUndefined", () => {
        it.each([null, undefined])("returns false for %j", (value) => {
            expect.assertions(1);

            expect(TypeUtils.isNotNullOrUndefined(value)).toBe(false);
        });

        it.each([0, "", false, {}, []])("returns true for %j", (value) => {
            expect.assertions(1);

            expect(TypeUtils.isNotNullOrUndefined(value)).toBe(true);
        });
    });
});

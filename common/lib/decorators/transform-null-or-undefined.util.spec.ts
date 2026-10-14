import { describe, expect, it } from "vitest";

import { shouldHaltFormDataTransform, transformNullOrUndefined } from "./transform-null-or-undefined.util";

describe(transformNullOrUndefined, () => {
    it.each([
        ["undefined", undefined],
        ["null", null],
        ["hello", "hello"],
        [42, 42],
        [null, null],
        [undefined, undefined]
    ])("maps %j to %j", (input, expected) => {
        expect.assertions(1);

        expect(transformNullOrUndefined(input)).toBe(expected);
    });
});

describe(shouldHaltFormDataTransform, () => {
    it.each([null, undefined, "", false, 0, Number.NaN])("returns true for %j", (value) => {
        expect.assertions(1);

        expect(shouldHaltFormDataTransform(value)).toBe(true);
    });

    it.each(["0", "false", "hello", true, 1, {}, []])("returns false for %j", (value) => {
        expect.assertions(1);

        expect(shouldHaltFormDataTransform(value)).toBe(false);
    });
});

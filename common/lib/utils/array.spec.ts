import { describe, expect, it } from "vitest";

import { ArrayUtils } from "./array";

describe("arrayUtils", () => {
    describe("groupBy", () => {
        it("groups items by key and flattens value arrays", () => {
            expect.assertions(2);

            const result = ArrayUtils.groupBy(
                [
                    { id: "a", tag: "x" },
                    { id: "a", tag: "y" },
                    { id: "b", tag: "z" }
                ],
                (item) => item.id,
                (item) => item.tag
            );

            expect(result.get("a")).toStrictEqual(["x", "y"]);
            expect(result.get("b")).toStrictEqual(["z"]);
        });

        it("skips items with nullish keys or values", () => {
            expect.assertions(1);

            const result = ArrayUtils.groupBy(
                [
                    { id: null, value: 1 },
                    { id: "ok", value: null },
                    { id: "ok", value: 2 }
                ],
                (item) => item.id,
                (item) => item.value
            );

            expect(result.get("ok")).toStrictEqual([2]);
        });

        it("accepts array values from the value selector", () => {
            expect.assertions(1);

            const result = ArrayUtils.groupBy(
                [{ id: "a", values: [1, 2] }],
                (item) => item.id,
                (item) => item.values
            );

            expect(result.get("a")).toStrictEqual([1, 2]);
        });
    });

    describe("joinIfDefined", () => {
        it("joins truthy values with the default separator", () => {
            expect.assertions(1);

            expect(ArrayUtils.joinIfDefined(["a", null, "b", undefined, "", 0, "c"])).toBe("a b c");
        });

        it("uses a custom join string", () => {
            expect.assertions(1);

            expect(ArrayUtils.joinIfDefined(["a", "b"], ",")).toBe("a,b");
        });
    });

    describe("uniqueValues", () => {
        it("returns unique mapped values preserving first occurrence order", () => {
            expect.assertions(1);

            const result = ArrayUtils.uniqueValues([{ n: 1 }, { n: 2 }, { n: 1 }, { n: 3 }], (item) => item.n);

            expect(result).toStrictEqual([1, 2, 3]);
        });
    });
});

describe("array.prototype.sum", () => {
    it("sums numbers and formats with default digits", () => {
        expect.assertions(1);

        expect([1, 2, 3.456].sum()).toBe("6.46");
    });

    it("formats with a custom digit count", () => {
        expect.assertions(1);

        expect([1, 2].sum(0)).toBe("3");
    });
});

import { describe, expect, it } from "vitest";

import { ObjectUtils } from "./objects";

describe("objectUtils", () => {
    describe("forEachProperty", () => {
        it("transforms scalar properties", () => {
            expect.assertions(1);

            const target = { a: 1, b: 2 };

            ObjectUtils.forEachProperty(target, (value) => value * 2);

            expect(target).toStrictEqual({ a: 2, b: 4 });
        });

        it("transforms array elements in place", () => {
            expect.assertions(1);

            const target = { items: ["true", "false"] };

            ObjectUtils.forEachProperty(target, (value) => value);

            expect(target.items).toStrictEqual(["true", "false"]);
        });

        it("recurses into nested objects when objectHandle is provided", () => {
            expect.assertions(1);

            const target = { nested: { flag: "true" } };

            ObjectUtils.forEachProperty(
                target,
                (value) => value,
                (nested) => {
                    ObjectUtils.forEachProperty(nested, (value) => (value === "true" ? true : value));
                }
            );

            expect(target).toStrictEqual({ nested: { flag: true } });
        });
    });

    describe("objectToArrayOfProperties", () => {
        it("collects shallow property values", () => {
            expect.assertions(1);

            expect(ObjectUtils.objectToArrayOfProperties({ a: 1, b: "two" })).toStrictEqual([1, "two"]);
        });

        it("collects nested object snapshots when deep is true", () => {
            expect.assertions(1);

            expect(ObjectUtils.objectToArrayOfProperties({ a: 1, nested: { x: 2 } }, true)).toStrictEqual([1, [2]]);
        });
    });

    describe("stringBoolsToBools", () => {
        it("converts string booleans at every depth", () => {
            expect.assertions(1);

            const target = {
                active: "true",
                nested: { disabled: "false", count: 3 }
            };

            ObjectUtils.stringBoolsToBools(target);

            expect(target).toStrictEqual({
                active: true,
                nested: { disabled: false, count: 3 }
            });
        });
    });
});

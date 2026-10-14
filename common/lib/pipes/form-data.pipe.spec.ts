/* eslint-disable @typescript-eslint/no-deprecated -- entire spec covers deprecated FormDataPipe */
import type { ArgumentMetadata } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import { FormDataPipe } from "./form-data.pipe";

const metadata: ArgumentMetadata = {
    type: "body",
    metatype: undefined,
    data: undefined
};

describe(FormDataPipe, () => {
    const pipe = new FormDataPipe();

    describe("transform", () => {
        it.each([
            ["true", true],
            ["false", false]
        ])("maps %j to boolean %j", (input, expected) => {
            expect.assertions(1);

            expect(pipe.transform(input, metadata)).toBe(expected);
        });

        it.each([
            ["0", 0],
            ["42", 42],
            ["-3", -3]
        ])("maps integer string %j to %j", (input, expected) => {
            expect.assertions(1);

            expect(pipe.transform(input, metadata)).toBe(expected);
        });

        it("leaves non-integer numeric strings unchanged", () => {
            expect.assertions(1);

            expect(pipe.transform("3.14", metadata)).toBe("3.14");
        });

        it("leaves arbitrary strings unchanged", () => {
            expect.assertions(1);

            expect(pipe.transform("hello", metadata)).toBe("hello");
        });

        it("transforms nested object values recursively", () => {
            expect.assertions(1);

            const input = {
                count: "10",
                nested: {
                    enabled: "true",
                    label: "test"
                }
            };

            expect(pipe.transform(input, metadata)).toStrictEqual({
                count: 10,
                nested: {
                    enabled: true,
                    label: "test"
                }
            });
        });

        it("rebuilds broken top-level bodies like ValidationPipe", () => {
            expect.assertions(1);

            const broken = Object.assign(Object.create(null) as Record<string, string>, { flag: "false" });

            expect(pipe.transform(broken, metadata)).toStrictEqual({ flag: false });
        });

        it("coerces null to 0 via integer parsing", () => {
            expect.assertions(1);

            expect(pipe.transform(null, metadata)).toBe(0);
        });

        it("returns undefined unchanged", () => {
            expect.assertions(1);

            expect(pipe.transform(undefined, metadata)).toBeUndefined();
        });
    });
});

import { plainToInstance } from "class-transformer";
import { describe, expect, it } from "vitest";

import { TransformNumber } from "./transform-number.decorator";

class NumberDto {
    @TransformNumber()
    public value!: unknown;
}

class NumberEachDto {
    @TransformNumber({ each: true })
    public value!: unknown;
}

describe(TransformNumber, () => {
    it.each([
        [42, 42],
        ["42", 42],
        ["0", 0],
        [0, 0],
        ["undefined", undefined],
        ["null", null],
        [null, null],
        [undefined, undefined]
    ])("maps %j to %j", (input, expected) => {
        expect.assertions(1);

        const dto = plainToInstance(NumberDto, { value: input });

        expect(dto.value).toBe(expected);
    });

    it("leaves empty string unchanged (falsy null/undefined guard)", () => {
        expect.assertions(1);

        const dto = plainToInstance(NumberDto, { value: "" });

        expect(dto.value).toBe("");
    });

    it("coerces invalid numeric strings to NaN", () => {
        expect.assertions(1);

        const dto = plainToInstance(NumberDto, { value: "not-a-number" });

        expect(dto.value).toBeNaN();
    });

    describe("with each: true", () => {
        it("transforms every array element", () => {
            expect.assertions(1);

            const dto = plainToInstance(NumberEachDto, {
                value: ["1", "2", "null", "undefined", 3]
            });

            expect(dto.value).toStrictEqual([1, 2, null, undefined, 3]);
        });
    });
});

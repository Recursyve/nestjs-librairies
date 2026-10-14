import { plainToInstance } from "class-transformer";
import { describe, expect, it } from "vitest";

import { TransformArray } from "./transform-array.decorator";

class ArrayDto {
    @TransformArray()
    public value!: unknown;
}

describe(TransformArray, () => {
    it.each([
        ["null", null],
        ["undefined", undefined],
        [null, null],
        [undefined, undefined],
        ["", ""],
        [0, 0],
        [false, false]
    ])("maps %j to %j without wrapping", (input, expected) => {
        expect.assertions(1);

        const dto = plainToInstance(ArrayDto, { value: input });

        expect(dto.value).toBe(expected);
    });

    it("wraps a scalar in an array", () => {
        expect.assertions(1);

        const dto = plainToInstance(ArrayDto, { value: "only" });

        expect(dto.value).toStrictEqual(["only"]);
    });

    it("leaves arrays unchanged", () => {
        expect.assertions(1);

        const dto = plainToInstance(ArrayDto, { value: ["a", "b"] });

        expect(dto.value).toStrictEqual(["a", "b"]);
    });
});

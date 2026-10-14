import { plainToInstance } from "class-transformer";
import { describe, expect, it } from "vitest";

import { TransformBoolean } from "./transform-boolean.decorator";

class BooleanDto {
    @TransformBoolean()
    public value!: unknown;
}

class BooleanEachDto {
    @TransformBoolean({ each: true })
    public value!: unknown;
}

describe(TransformBoolean, () => {
    it.each([
        [true, true],
        [false, false],
        ["true", true],
        ["false", false],
        ["undefined", undefined],
        ["null", null],
        [null, null],
        [undefined, undefined]
    ])("maps %j to %j", (input, expected) => {
        expect.assertions(1);

        const dto = plainToInstance(BooleanDto, { value: input });

        expect(dto.value).toBe(expected);
    });

    it("leaves non-boolean strings unchanged", () => {
        expect.assertions(1);

        const dto = plainToInstance(BooleanDto, { value: "maybe" });

        expect(dto.value).toBe("maybe");
    });

    it("leaves empty string unchanged", () => {
        expect.assertions(1);

        const dto = plainToInstance(BooleanDto, { value: "" });

        expect(dto.value).toBe("");
    });

    describe("with each: true", () => {
        it("transforms every array element", () => {
            expect.assertions(1);

            const dto = plainToInstance(BooleanEachDto, {
                value: ["true", "false", "null", "undefined", "x", true]
            });

            expect(dto.value).toStrictEqual([true, false, null, undefined, "x", true]);
        });

        it("does not treat a non-array as elements when each is set", () => {
            expect.assertions(1);

            const dto = plainToInstance(BooleanEachDto, { value: "true" });

            expect(dto.value).toBe(true);
        });
    });
});

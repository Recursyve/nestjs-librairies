import { plainToInstance } from "class-transformer";
import { describe, expect, it } from "vitest";

import { TransformJson } from "./transform-json.decorator";

class JsonDto {
    @TransformJson()
    public value!: unknown;
}

class JsonEachDto {
    @TransformJson({ each: true })
    public value!: unknown;
}

describe(TransformJson, () => {
    it.each([
        ["null", null],
        ["undefined", undefined],
        [null, null],
        [undefined, undefined],
        ['{"a":1}', { a: 1 }],
        ["[1,2]", [1, 2]]
    ])("maps %j appropriately", (input, expected) => {
        expect.assertions(1);

        const dto = plainToInstance(JsonDto, { value: input });

        expect(dto.value).toStrictEqual(expected);
    });

    it("passes through values that are already parsed", () => {
        expect.assertions(1);

        const object = { nested: true };

        const dto = plainToInstance(JsonDto, { value: object });

        expect(dto.value).toStrictEqual(object);
    });

    it("throws on invalid JSON strings", () => {
        expect.assertions(1);

        expect(() => plainToInstance(JsonDto, { value: "{" })).toThrow(SyntaxError);
    });

    describe("with each: true", () => {
        it("parses JSON in every array element", () => {
            expect.assertions(1);

            const dto = plainToInstance(JsonEachDto, {
                value: ['{"x":1}', "null", "[2]"]
            });

            expect(dto.value).toStrictEqual([{ x: 1 }, null, [2]]);
        });
    });
});

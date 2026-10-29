import { plainToInstance } from "class-transformer";
import { describe, expect, it } from "vitest";

import { TransformNullOrUndefined } from "./transform-null-or-undefined.decorator";

class NullOrUndefinedDto {
    @TransformNullOrUndefined()
    public value!: unknown;
}

describe(TransformNullOrUndefined, () => {
    it.each([
        ["undefined", undefined],
        ["null", null],
        ["hello", "hello"],
        [42, 42]
    ])("maps %j to %j", (input, expected) => {
        expect.assertions(1);

        const dto = plainToInstance(NullOrUndefinedDto, { value: input });

        expect(dto.value).toBe(expected);
    });
});

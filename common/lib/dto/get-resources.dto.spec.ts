import { plainToInstance } from "class-transformer";
import type { ValidationError } from "class-validator";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";

import { GetResourcesDto } from "./get-resources.dto";

async function transformAndValidate(
    plain: Record<string, unknown>
): Promise<{ dto: GetResourcesDto; errors: ValidationError[] }> {
    const dto = plainToInstance(GetResourcesDto, plain, { excludeExtraneousValues: true });
    const errors = await validate(dto);
    return { dto, errors };
}

describe(GetResourcesDto, () => {
    it("accepts an empty payload when extended is omitted", async () => {
        expect.assertions(2);

        const { dto, errors } = await transformAndValidate({});

        expect(errors).toHaveLength(0);
        expect(dto.extended).toBeUndefined();
    });

    it.each([
        ["true", true],
        ["false", false],
        [true, true],
        [false, false]
    ])("maps extended=%j to %j and validates", async (input, expected) => {
        expect.assertions(2);

        const { dto, errors } = await transformAndValidate({ extended: input });

        expect(errors).toHaveLength(0);
        expect(dto.extended).toBe(expected);
    });

    it.each([
        ["null", null],
        ["undefined", undefined]
    ])("allows optional extended when form value is %j", async (input, expected) => {
        expect.assertions(2);

        const { dto, errors } = await transformAndValidate({ extended: input });

        expect(errors).toHaveLength(0);
        expect(dto.extended).toBe(expected);
    });

    it("rejects extended when it is not a boolean after transform", async () => {
        expect.assertions(3);

        const { dto, errors } = await transformAndValidate({ extended: "maybe" });

        expect(errors).toHaveLength(1);
        expect(errors[0]?.property).toBe("extended");
        expect(dto.extended).toBe("maybe");
    });

    it("does not map properties without @Expose()", async () => {
        expect.assertions(2);

        const { dto, errors } = await transformAndValidate({ extended: "true", other: "ignored" });

        expect(errors).toHaveLength(0);
        expect(dto).not.toHaveProperty("other");
    });
});

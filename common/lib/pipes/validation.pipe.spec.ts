import "reflect-metadata";

import type { ArgumentMetadata } from "@nestjs/common";
import { HttpException, HttpStatus } from "@nestjs/common";
import { Expose } from "class-transformer";
import { IsBoolean, IsString } from "class-validator";
import { describe, expect, it } from "vitest";

import { ValidationPipe } from "./validation.pipe";

class NameDto {
    @Expose()
    @IsString()
    public name!: string;
}

class FlagDto {
    @Expose()
    @IsBoolean()
    public active!: boolean;
}

describe(ValidationPipe, () => {
    describe("rebuildObjectIfBroken", () => {
        it("returns the same reference when value is a normal object", () => {
            expect.assertions(1);

            const value = { extended: "true" };

            expect(ValidationPipe.rebuildObjectIfBroken(value)).toBe(value);
        });

        it("rebuilds objects that are not instanceof Object (e.g. null prototype)", () => {
            expect.assertions(3);

            const broken = Object.assign(Object.create(null) as Record<string, string>, {
                extended: "true",
                count: "2"
            });
            const rebuilt = ValidationPipe.rebuildObjectIfBroken(broken);

            expect(rebuilt).not.toBe(broken);
            expect(rebuilt).toStrictEqual({ extended: "true", count: "2" });
            expect(rebuilt instanceof Object).toBe(true);
        });
    });

    const pipe = new ValidationPipe();

    describe("transform", () => {
        it("returns the value unchanged when metatype is a primitive type", async () => {
            expect.assertions(2);

            const metadata: ArgumentMetadata = { type: "body", metatype: String, data: undefined };

            await expect(pipe.transform("hello", metadata)).resolves.toBe("hello");
            await expect(pipe.transform(42, { type: "body", metatype: Number, data: undefined })).resolves.toBe(42);
        });

        it("returns the value unchanged when metatype is missing", async () => {
            expect.assertions(1);

            const metadata: ArgumentMetadata = { type: "body", metatype: undefined, data: undefined };

            await expect(pipe.transform({ any: "thing" }, metadata)).resolves.toStrictEqual({ any: "thing" });
        });

        it("transforms and validates a DTO instance", async () => {
            expect.assertions(2);

            const result = await pipe.transform(
                { name: "acme" },
                {
                    type: "body",
                    metatype: NameDto,
                    data: undefined
                }
            );

            expect(result).toBeInstanceOf(NameDto);
            expect((result as NameDto).name).toBe("acme");
        });

        it("applies stringBoolsToBools before validation", async () => {
            expect.assertions(1);

            const result = await pipe.transform(
                { active: "true" },
                {
                    type: "body",
                    metatype: FlagDto,
                    data: undefined
                }
            );

            expect((result as FlagDto).active).toBe(true);
        });

        it("strips properties without @Expose()", async () => {
            expect.assertions(2);

            const result = await pipe.transform(
                { name: "acme", secret: "hidden" },
                {
                    type: "body",
                    metatype: NameDto,
                    data: undefined
                }
            );

            expect((result as NameDto).name).toBe("acme");
            expect(result).not.toHaveProperty("secret");
        });

        it("throws HttpException when validation fails", async () => {
            expect.assertions(3);

            const rejection = pipe.transform(
                { name: 123 },
                {
                    type: "body",
                    metatype: NameDto,
                    data: undefined
                }
            );

            await expect(rejection).rejects.toBeInstanceOf(HttpException);

            const error = await rejection.catch((caught: unknown) => caught);
            const exception = error as HttpException;

            expect(exception.getStatus()).toBe(HttpStatus.PRECONDITION_FAILED);
            expect(exception.getResponse()).toStrictEqual({
                message: "Validation failed",
                errors: ["name"]
            });
        });

        it("rebuilds broken form bodies before plainToClass", async () => {
            expect.assertions(1);

            const broken = Object.assign(Object.create(null) as Record<string, string>, { name: "from-multer" });
            const result = await pipe.transform(broken, {
                type: "body",
                metatype: NameDto,
                data: undefined
            });

            expect((result as NameDto).name).toBe("from-multer");
        });
    });
});

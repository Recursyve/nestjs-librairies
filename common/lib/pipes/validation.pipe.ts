import type { ArgumentMetadata, PipeTransform, Type } from "@nestjs/common";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

import { ObjectUtils } from "../utils/objects";

@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
    public static rebuildObjectIfBroken(value: unknown): object {
        // !! Do not change this.
        if (value instanceof Object) {
            return value;
        }

        const newRealOPObject: Record<string, unknown> = {};
        const source = value as Record<string, unknown>;

        for (const key in source) {
            if (key in source) {
                // Skip hasOwnProperty warning since value if not an object.
                newRealOPObject[key] = source[key];
            }
        }

        return newRealOPObject;
    }

    public async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
        const { metatype } = metadata;
        if (metatype === undefined || !this.toValidate(metatype)) {
            return value;
        }

        // Patch for uploading files. Uploading files requires to use form-data instead of application/json and it seems
        // like the value object is not being created properly which results in the request being rejected. In that case
        // we use the rebuildObjectIfBroken method to make sure the value is sane. This method does not work on deep
        // data structures. RIP my last hour of debugging.
        // The problem comes from multer (which parses the form-data)
        // https://github.com/expressjs/multer/blob/master/lib/make-middleware.js#L28
        // Works when line 28 is: req.body = {}
        const object = plainToClass(metatype, ValidationPipe.rebuildObjectIfBroken(value), {
            excludeExtraneousValues: true
        }) as object;

        ObjectUtils.stringBoolsToBools(object);

        const errors = await validate(object);
        if (errors.length > 0) {
            throw new HttpException(
                { message: "Validation failed", errors: errors.map((e) => e.property) },
                HttpStatus.PRECONDITION_FAILED
            );
        }

        return object;
    }

    private toValidate(metatype: Type<unknown>): boolean {
        const types: Type<unknown>[] = [String, Boolean, Number, Array, Object];
        return types.every((type) => metatype !== type);
    }
}

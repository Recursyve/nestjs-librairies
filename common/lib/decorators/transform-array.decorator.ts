import { Transform } from "class-transformer";

import { shouldHaltFormDataTransform, transformNullOrUndefined } from "./transform-null-or-undefined.util";

/**
 * Transforms a form data field in an array if the value is not an array.
 * If the value is null or undefined, it stays null or undefined
 */
export const TransformArray = (): PropertyDecorator =>
    Transform(({ value }): unknown => {
        const nullOrUndefined = transformNullOrUndefined(value);
        if (shouldHaltFormDataTransform(nullOrUndefined)) {
            return nullOrUndefined;
        }

        if (shouldHaltFormDataTransform(value)) {
            return undefined;
        }

        if (!Array.isArray(value)) {
            return [value];
        }

        return value;
    });

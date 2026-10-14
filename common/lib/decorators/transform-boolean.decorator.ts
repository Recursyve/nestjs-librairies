import { Transform } from "class-transformer";

import { shouldHaltFormDataTransform, transformNullOrUndefined } from "./transform-null-or-undefined.util";
import type { TransformsDecoratorOptions } from "./transforms.decorator-options";

const transformBoolean = (value: unknown): unknown => {
    if (typeof value === "boolean") {
        return value;
    }

    const nullOrUndefined = transformNullOrUndefined(value);
    if (shouldHaltFormDataTransform(nullOrUndefined)) {
        return nullOrUndefined;
    }

    if (value === "true" || value === "false") {
        return value === "true";
    }

    return value;
};

/**
 * Transforms a form data field from string to boolean
 * If the value is null or undefined, it stays null or undefined
 * @param opts.each: If the value is an array, transforms all elements of the array
 */
export const TransformBoolean = (opts?: TransformsDecoratorOptions): PropertyDecorator =>
    Transform(({ value }) => {
        const { each } = opts ?? {};
        if (each === true && Array.isArray(value)) {
            return value.map((x) => transformBoolean(x));
        }

        return transformBoolean(value);
    });

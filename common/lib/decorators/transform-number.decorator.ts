import { Transform } from "class-transformer";

import { shouldHaltFormDataTransform, transformNullOrUndefined } from "./transform-null-or-undefined.util";
import type { TransformsDecoratorOptions } from "./transforms.decorator-options";

const transformNumber = (value: unknown): unknown => {
    if (typeof value === "number") {
        return value;
    }

    const nullOrUndefined = transformNullOrUndefined(value);
    if (shouldHaltFormDataTransform(nullOrUndefined)) {
        return nullOrUndefined;
    }

    return Number(value);
};

/**
 * Transforms a form data field from string to number
 * If the value is null or undefined, it stays null or undefined
 * @param opts.each: If the value is an array, transforms all elements of the array
 */
export const TransformNumber = (opts?: TransformsDecoratorOptions): PropertyDecorator =>
    Transform(({ value }) => {
        const { each } = opts ?? {};
        if (each === true && Array.isArray(value)) {
            return value.map((x) => transformNumber(x));
        }

        return transformNumber(value);
    });

import { Transform } from "class-transformer";

import { shouldHaltFormDataTransform, transformNullOrUndefined } from "./transform-null-or-undefined.util";
import type { TransformsDecoratorOptions } from "./transforms.decorator-options";

const transformJson = (value: unknown): unknown => {
    const nullOrUndefined = transformNullOrUndefined(value);
    if (shouldHaltFormDataTransform(nullOrUndefined)) {
        return nullOrUndefined;
    }

    if (typeof value !== "string") {
        return value;
    }

    return JSON.parse(value) as unknown;
};

/**
 * Transforms a form data field from string to json
 * If the value is null or undefined, it stays null or undefined
 * @param opts.each: If the value is an array, transforms all elements of the array
 */
export const TransformJson = (opts?: TransformsDecoratorOptions): PropertyDecorator =>
    Transform(({ value }) => {
        const { each } = opts ?? {};
        if (each === true && Array.isArray(value)) {
            return value.map((x) => transformJson(x));
        }

        return transformJson(value);
    });

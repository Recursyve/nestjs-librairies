import { Transform } from "class-transformer";

export interface TransformsDecoratorOptions {
    each?: boolean;
}

const transformNullOrUndefined = (value: any) => {
    return value === "undefined" ?
        undefined : value === "null" ?
            null : value;
};

export const TransformNullOrUndefined = () => Transform(({ value }) => transformNullOrUndefined(value));

const transformBoolean = (value: any) => {
    if (typeof value === "boolean") {
        return value;
    }

    const nullOrUndefined = transformNullOrUndefined(value);
    if (!nullOrUndefined) {
        return nullOrUndefined;
    }

    if (value === "true" || value === "false") {
        return value === true;
    }

    return value;
}

/**
 * Transforms a form data field from string to boolean
 * If the value is null or undefined, it stays null or undefined
 * @param opts.each: If the value is an array, transforms all elements of the array
 */
export const TransformBoolean = (opts?: TransformsDecoratorOptions) => Transform(({ value }) => {
    const { each } = opts ?? {};
    if (each && Array.isArray(value)) {
        return value.map(x => transformBoolean(x));
    }

    return transformBoolean(value);
});

const transformNumber = (value: any) => {
    if (typeof value === "number") {
        return value;
    }

    const nullOrUndefined = transformNullOrUndefined(value);
    if (!nullOrUndefined) {
        return nullOrUndefined;
    }

    return +value;
}

/**
 * Transforms a form data field from string to number
 * If the value is null or undefined, it stays null or undefined
 * @param opts.each: If the value is an array, transforms all elements of the array
 */
export const TransformNumber = (opts?: TransformsDecoratorOptions) => Transform(({ value }) => {
    const { each } = opts ?? {};
    if (each && Array.isArray(value)) {
        return value.map(x => transformNumber(x));
    }

    return transformNumber(value);
});

const transformJson = (value: any) => {
    const nullOrUndefined = transformNullOrUndefined(value);
    if (!nullOrUndefined) {
        return nullOrUndefined;
    }

    if (typeof value !== "string") {
        return value;
    }

    return JSON.parse(value);
}

/**
 * Transforms a form data field from string to json
 * If the value is null or undefined, it stays null or undefined
 * @param opts.each: If the value is an array, transforms all elements of the array
 */
export const TransformJson = (opts?: TransformsDecoratorOptions) => Transform(({ value }) => {
    const { each } = opts ?? {};
    if (each && Array.isArray(value)) {
        return value.map(x => transformJson(x));
    }

    return transformJson(value);
});

/**
 * Transforms a form data field in an array if the value is not an array.
 * If the value is null or undefined, it stays null or undefined
 */
export const TransformArray = () => Transform(({ value }) => {
    const nullOrUndefined = transformNullOrUndefined(value);
    if (!nullOrUndefined) {
        return nullOrUndefined;
    }

    if (!value) return undefined;
    if (!Array.isArray(value)) return [value];
    return value;
});

import { Transform } from "class-transformer";

const transformNullOrUndefined = (value) => {
    return value === "undefined" ?
        undefined : value === "null" ?
            null : value;
};

export const TransformNullOrUndefined = () => Transform(({ value }) => transformNullOrUndefined(value));
export const TransformBoolean = () => Transform(({ value }) => {
    if (typeof value === "boolean") {
        return value;
    }

    const nullOrUndefined = transformNullOrUndefined(value);
    if (!nullOrUndefined) {
        return nullOrUndefined;
    }

    return value === "true";
});
export const TransformNumber = () => Transform(({ value }) => {
    if (typeof value === "number") {
        return value;
    }

    const nullOrUndefined = transformNullOrUndefined(value);
    if (!nullOrUndefined) {
        return nullOrUndefined;
    }

    return +value;
});
export const TransformJson = () => Transform(({ value }) => {
    const nullOrUndefined = transformNullOrUndefined(value);
    if (!nullOrUndefined) {
        return nullOrUndefined;
    }

    if (typeof value !== "string") {
        return value;
    }

    return JSON.parse(value);
});

export const transformNullOrUndefined = (value: unknown): unknown => {
    return value === "undefined" ? undefined : value === "null" ? null : value;
};

/** Matches the legacy `if (!value)` guard used after sentinel resolution. */
export const shouldHaltFormDataTransform = (value: unknown): boolean => {
    if (value === null || value === undefined || value === "") {
        return true;
    }

    if (value === false || value === 0) {
        return true;
    }

    return typeof value === "number" && Number.isNaN(value);
};

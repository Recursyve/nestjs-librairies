export const GEO_POINT_SRID = 4326;

export class GeoPoint {
    public type = "Point";

    constructor(public coordinates: number[]) {}
}

interface DateOnlyAttributeDefinition {
    type: { key: string };
}

interface DateOnlyFormattable {
    dataValues: Record<string, unknown>;
    rawAttributes: Record<string, DateOnlyAttributeDefinition>;
}

function isDateOnlyFormattable(value: unknown): value is DateOnlyFormattable {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    if (!("dataValues" in value) || !("rawAttributes" in value)) {
        return false;
    }

    const record = value as { dataValues?: unknown; rawAttributes?: unknown };
    const { dataValues, rawAttributes } = record;
    return (
        typeof dataValues === "object" &&
        dataValues !== null &&
        typeof rawAttributes === "object" &&
        rawAttributes !== null
    );
}

function isConvertibleDateOnlyValue(value: unknown): value is Date | number | string {
    if (value === null || value === undefined || value === "") {
        return false;
    }

    return typeof value === "string" || typeof value === "number" || value instanceof Date;
}

function isDateOnlyColumn(instance: DateOnlyFormattable, key: string): boolean {
    const attribute = instance.rawAttributes[key];
    if (attribute === undefined) {
        return false;
    }

    const designType: unknown = Reflect.getMetadata("design:type", instance, key);
    return attribute.type.key === "DATEONLY" && designType === Date;
}

function convertDateOnlyField(instance: DateOnlyFormattable, key: string, value: unknown): void {
    if (!isConvertibleDateOnlyValue(value)) {
        return;
    }

    instance.dataValues[key] = new Date(value);
}

function formatNestedValues(value: unknown, formatInstance: (instance: unknown) => void): void {
    if (Array.isArray(value)) {
        for (const item of value) {
            formatInstance(item);
        }

        return;
    }

    if (value !== null && typeof value === "object") {
        formatInstance(value);
    }
}

function formatFormattableInstance(instance: DateOnlyFormattable): void {
    const formatInstance = SequelizeUtils.formatInstanceDateOnly;

    for (const key of Object.keys(instance.dataValues)) {
        const value = instance.dataValues[key];

        if (isDateOnlyColumn(instance, key)) {
            convertDateOnlyField(instance, key, value);
            continue;
        }

        formatNestedValues(value, formatInstance);
    }
}

export namespace SequelizeUtils {
    export function formatInstanceDateOnly(instance: unknown): void {
        if (!isDateOnlyFormattable(instance)) {
            return;
        }

        formatFormattableInstance(instance);
    }
}

type LeafValue<V> = V extends readonly (infer Element)[] ? Element : V;

function isNestedRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStringBool(value: unknown): unknown {
    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    return value;
}

export namespace ObjectUtils {
    export function forEachProperty<V>(
        object: Record<string, V>,
        valueHandle: (value: LeafValue<V>) => unknown,
        objectHandle?: ((object: Record<string, unknown>) => void) | null
    ): void {
        for (const property of Object.keys(object)) {
            if (!Object.hasOwn(object, property)) {
                continue;
            }

            const value = object[property];

            if (Array.isArray(value)) {
                for (let index = 0; index < value.length; index++) {
                    value[index] = valueHandle(value[index] as LeafValue<V>) as (typeof value)[number];
                }

                continue;
            }

            if (objectHandle && isNestedRecord(value)) {
                objectHandle(value);
                continue;
            }

            object[property] = valueHandle(value as LeafValue<V>) as V;
        }
    }

    export function objectToArrayOfProperties(object: object, deep = false): unknown[] {
        const properties: unknown[] = [];

        ObjectUtils.forEachProperty(
            object as Record<string, unknown>,
            (value) => {
                properties.push(value);
                return value;
            },
            deep
                ? (nested) => {
                      properties.push(ObjectUtils.objectToArrayOfProperties(nested));
                  }
                : null
        );

        return properties;
    }

    export function stringBoolsToBools(object: object): void {
        ObjectUtils.forEachProperty(object as Record<string, unknown>, parseStringBool, (nested) => {
            ObjectUtils.stringBoolsToBools(nested);
        });
    }
}

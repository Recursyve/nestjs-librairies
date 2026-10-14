export namespace ArrayUtils {
    export function groupBy<Item, Key, Value>(
        array: Item[],
        keySelector: (item: Item) => Key,
        valueSelector: (item: Item) => Value | Value[]
    ): Map<Key, Value[]> {
        const groups: Map<Key, Value[]> = new Map<Key, Value[]>();
        for (const item of array) {
            const key: Key = keySelector(item);
            if (key == null) {
                continue;
            }
            let value: Value | Value[] = valueSelector(item);
            if (value == null) {
                continue;
            }

            if (!(value instanceof Array)) {
                value = [value];
            }

            if (!groups.has(key)) {
                groups.set(key, value);
            } else {
                groups.get(key)?.push(...value);
            }
        }
        return groups;
    }

    export function joinIfDefined(array: unknown[], join = " "): string {
        return array.filter((val) => Boolean(val)).join(join);
    }

    export function uniqueValues<Item, Value>(array: Item[], valueSelector: (item: Item) => Value): Value[] {
        return [...new Set(array.map(valueSelector))];
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `T` is required for global `Array` augmentation
    interface Array<T> {
        /**
         * Sums numeric elements and formats the result (only defined on `number[]`).
         */
        sum(this: number[], digits?: number): string;
    }
}

Array.prototype.sum = function (digits = 2): string {
    return this.reduce((a, b) => a + b, 0).toFixed(digits);
};

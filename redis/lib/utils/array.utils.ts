export namespace RedisArrayUtils {
    export function getSlices<T>(items: T[], size: number): T[][] {
        const res = [];
        let start = 0;
        do {
            res.push(items.slice(start, start + size));
            start += size;
        } while (start < items.length);
        return res;
    }
}

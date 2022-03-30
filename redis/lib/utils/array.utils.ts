export class RedisArrayUtils {
    public static getSlices<T = any>(items: T[], size: number): T[][] {
        const res = [];
        let start = 0;
        do {
            res.push(items.slice(start, start + size));
            start += size;
        } while (start < items.length)
        return res;
    }
}

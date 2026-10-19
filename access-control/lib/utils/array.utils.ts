export function arrayUnique<T>(array: T[], keySelector: (item: T) => unknown = (item) => item): T[] {
    const seen = new Set<unknown>();

    return array.filter((item) => {
        const key = keySelector(item);
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

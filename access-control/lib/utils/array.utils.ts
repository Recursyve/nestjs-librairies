export function arrayUnique<T>(array: T[], keySelector: (t: T) => any = (t) => t): T[] {
    return array.filter((item1, index) => {
        const item1Key = keySelector(item1);
        return array.findIndex((item2) => keySelector(item2) === item1Key) === index;
    });
}

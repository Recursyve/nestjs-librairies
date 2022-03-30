export class TypeUtils {
    public static isNullOrUndefined(obj): boolean {
        return obj === null || obj === undefined;
    }
    public static isNotNullOrUndefined(obj): boolean {
        return obj !== null && obj !== undefined;
    }
}

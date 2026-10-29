export namespace TypeUtils {
    export function isNullOrUndefined(obj: unknown): obj is null | undefined {
        return obj === null || obj === undefined;
    }

    export function isNotNullOrUndefined<T>(obj: T | null | undefined): obj is T {
        return obj !== null && obj !== undefined;
    }
}

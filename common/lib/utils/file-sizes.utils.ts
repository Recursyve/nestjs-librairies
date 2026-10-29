export enum FileSizes {
    Bytes = "bytes",
    KB = "kb",
    MB = "mb",
    GB = "gb",
    TB = "tb"
}

export namespace FileSizeUtils {
    const bytesTransform: Record<FileSizes, number> = {
        [FileSizes.Bytes]: 1,
        [FileSizes.KB]: 1024,
        [FileSizes.MB]: 1024 * 1024,
        [FileSizes.GB]: 1024 * 1024 * 1024,
        [FileSizes.TB]: 1024 * 1024 * 1024 * 1024
    };

    export function inBytes(value: number, sizes: FileSizes): number {
        const size = bytesTransform[sizes];
        if (!size) {
            return 0;
        }

        return value * size;
    }
}

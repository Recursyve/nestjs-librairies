export enum FileSizes {
    Bytes = "bytes",
    KB = "kb",
    MB = "mb",
    GB = "gb",
    TB = "tb"
}

export class FileSizeUtils {
    private static bytesTransform: { [size: string]: number } = {
        [FileSizes.Bytes]: 1,
        [FileSizes.KB]: 1024,
        [FileSizes.MB]: 1024 * 1024,
        [FileSizes.GB]: 1024 * 1024 * 1024,
        [FileSizes.TB]: 1024 * 1024 * 1024 * 1024
    };

    public static inBytes(value: number, sizes: FileSizes): number {
        const size = this.bytesTransform[sizes];
        if (!size) {
            return 0;
        }

        return value * size;
    }
}

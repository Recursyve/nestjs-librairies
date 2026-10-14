import { describe, expect, it } from "vitest";

import { FileSizeUtils, FileSizes } from "./file-sizes.utils";

describe("fileSizeUtils", () => {
    describe("inBytes", () => {
        it.each([
            [1, FileSizes.Bytes, 1],
            [2, FileSizes.KB, 2048],
            [1, FileSizes.MB, 1024 * 1024],
            [1, FileSizes.GB, 1024 * 1024 * 1024],
            [1, FileSizes.TB, 1024 * 1024 * 1024 * 1024]
        ])("converts %j %s to %j bytes", (value, unit, expected) => {
            expect.assertions(1);

            expect(FileSizeUtils.inBytes(value, unit)).toBe(expected);
        });

        it("returns 0 for an unknown size unit", () => {
            expect.assertions(1);

            expect(FileSizeUtils.inBytes(10, "unknown" as FileSizes)).toBe(0);
        });
    });
});

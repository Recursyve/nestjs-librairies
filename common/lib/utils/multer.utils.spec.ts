import { UnsupportedMediaTypeException } from "@nestjs/common";
import type { Request } from "express";
import { describe, expect, it, vi } from "vitest";

import { MulterUtils } from "./multer.utils";

describe("multerUtils", () => {
    describe("filterFileExtensions", () => {
        it("accepts files whose mimetype is allowed", () => {
            expect.assertions(2);

            const filter = MulterUtils.filterFileExtensions(["image/png", "image/jpeg"]);
            const callback = vi.fn<(error: Error | null, acceptFile: boolean) => void>();
            const file = { mimetype: "image/png" } as Express.Multer.File;

            filter({} as Request, file, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(null, true);
        });

        it("rejects files whose mimetype is not allowed", () => {
            expect.assertions(3);

            const filter = MulterUtils.filterFileExtensions(["image/png"]);
            const callback = vi.fn<(error: Error | null, acceptFile: boolean) => void>();
            const file = { mimetype: "application/pdf" } as Express.Multer.File;

            filter({} as Request, file, callback);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback.mock.calls[0]?.[1]).toBe(false);
            expect(callback.mock.calls[0]?.[0]).toBeInstanceOf(UnsupportedMediaTypeException);
        });
    });
});

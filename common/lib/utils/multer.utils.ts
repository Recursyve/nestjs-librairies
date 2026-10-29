import { UnsupportedMediaTypeException } from "@nestjs/common";
import type { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import type { Request } from "express";

export type FileFilter = NonNullable<MulterOptions["fileFilter"]>;

export namespace MulterUtils {
    export function filterFileExtensions(mimetypes: string[]): FileFilter {
        return (
            req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, acceptFile: boolean) => void
        ) => {
            if (!mimetypes.some((mt) => mt == file.mimetype)) {
                callback(new UnsupportedMediaTypeException("File extension not supported"), false);
                return;
            }

            callback(null, true);
        };
    }
}

import { UnsupportedMediaTypeException } from "@nestjs/common";

export class MulterUtils {
    public static filterFileExtensions(mimetypes: string[]): any {
        return (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
            if (!mimetypes.some((mt) => mt == file.mimetype)) {
                return callback(new UnsupportedMediaTypeException("File extension not supported"), false);
            }

            return callback(null, true);
        };
    }
}

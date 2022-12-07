import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";
import { ValidationPipe } from "./validation.pipe";

/**
 * @deprecated Use @Transform decorators instead
 */
@Injectable()
export class FormDataPipe implements PipeTransform<any> {
    public transform(value: any, metadata: ArgumentMetadata) {
        if (value && typeof value === "object") {
            value = ValidationPipe.rebuildObjectIfBroken(value);
            for (const key in value) {
                if (!value.hasOwnProperty(key)) {
                    continue;
                }
                value[key] = this.transform(value[key], metadata);
            }
            return value;
        }

        if (!isNaN(value) && Number.isInteger(+value)) {
            return +value;
        }
        if (value === "true") {
            return true;
        }
        if (value === "false") {
            return false;
        }

        return value;
    }
}

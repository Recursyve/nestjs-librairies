import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { Injectable } from "@nestjs/common";

import { ValidationPipe } from "./validation.pipe";

/**
 * @deprecated Use @Transform decorators instead
 */
@Injectable()
export class FormDataPipe implements PipeTransform<unknown, unknown> {
    public transform(value: unknown, metadata: ArgumentMetadata): unknown {
        if (value !== null && typeof value === "object") {
            const record = ValidationPipe.rebuildObjectIfBroken(value) as Record<string, unknown>;

            for (const key in record) {
                if (!Object.hasOwn(record, key)) {
                    continue;
                }
                record[key] = this.transform(record[key], metadata);
            }

            return record;
        }

        const numeric = Number(value);
        if (!Number.isNaN(numeric) && Number.isInteger(numeric)) {
            return numeric;
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

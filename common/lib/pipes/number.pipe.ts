import { ArgumentMetadata, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class NumberPipe implements PipeTransform<any> {
    public transform(value: any, metadata: ArgumentMetadata) {
        if (typeof value === "object") {
            return value;
        }

        if (!isNaN(value) && Number.isInteger(+value)) {
            return +value;
        }
        return value;
    }
}

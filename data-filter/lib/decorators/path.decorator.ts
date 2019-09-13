import { PATH } from "../constant";
import { IncludeWhereModel } from "../models/include.model";

export function Path(path: string, where?: IncludeWhereModel, required?: boolean): PropertyDecorator {
    return (target: Object, propertyKey: string) => {
        Reflect.defineMetadata(
            PATH.replace("{{path}}", propertyKey),
            {
                path,
                where,
                required
            },
            target
        );
    };
}

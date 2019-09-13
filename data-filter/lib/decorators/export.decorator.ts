import { EXPORTS } from "../constant";

export function Exports(columns: string[]): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(EXPORTS, columns, target);
    };
}

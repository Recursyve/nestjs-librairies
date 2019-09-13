import { Model } from "sequelize-typescript";
import { MODEL } from "../constant";

export function Data(model: typeof Model): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(MODEL, model, target);
    };
}

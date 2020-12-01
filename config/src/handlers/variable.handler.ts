import { VariableModel } from "../models/variable.model";
import "reflect-metadata";
import { VARIABLES } from "../constant";

export class VariableHandler {
    public static getVariable(target: Object, propertyKey: string): VariableModel {
        const variables: VariableModel[] = Reflect.getMetadata(VARIABLES, target) || [];
        const variable = variables.find((x) => x.propertyKey === propertyKey);
        if (!variable) {
            return null;
        }
        return variable;
    }

    public static saveVariable(target: Object, config: VariableModel): void {
        const variables: VariableModel[] = Reflect.getMetadata(VARIABLES, target) || [];
        const variable = variables.find((x) => x.propertyKey === config.propertyKey);
        if (variable) {
            return;
        }

        variables.push(config);
        Reflect.defineMetadata(VARIABLES, variables, target);
    }
}

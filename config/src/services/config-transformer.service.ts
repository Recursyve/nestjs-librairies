import { VariableScanner } from "../scanners/variable.scanner";
import { Injectable, Type } from "@nestjs/common";

@Injectable()
export class ConfigTransformerService {
    constructor(private scanner: VariableScanner) {}

    public transform(config: Type<any>): any {
        const variables = this.scanner.getVariables(config);
        const instance = new config();

        for (const variable of variables) {
            Object.assign(instance, {
                [variable.propertyKey]: process.env[variable.variableName]
            });

            if (!process.env[variable.variableName] && variable.required) {
                throw new Error(`You must define the following environment variable: ${variable.variableName}`);
            }
        }
        return instance;
    }
}

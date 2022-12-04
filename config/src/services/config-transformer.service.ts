import { VariableScanner } from "../scanners/variable.scanner";
import { Injectable, Type } from "@nestjs/common";

@Injectable()
export class ConfigTransformerService {
    constructor(private scanner: VariableScanner) {}

    public transform(config: Type): any {
        const variables = this.scanner.getVariables(config);
        const instance = new config();

        for (const variable of variables) {
            Object.assign(instance, {
                [variable.propertyKey]: process.env[variable.variableName]
            });

            if (!process.env[variable.variableName] && variable.required) {
                if (process.env.NODE_ENV === "test" || !!process.env.CI) {
                    console.log(`The following environment variable is not defined: ${variable.variableName}. Skipping for test mode.`);
                    continue;
                }

                throw new Error(`You must define the following environment variable: ${variable.variableName}`);
            }
        }
        return instance;
    }
}

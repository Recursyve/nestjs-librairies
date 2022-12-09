import { VariableScanner } from "../scanners/variable.scanner";
import { Injectable, Type } from "@nestjs/common";
import { ConfigProvider } from "../providers/config-provider";

@Injectable()
export class ConfigTransformerService {
    constructor(private scanner: VariableScanner, private configProvider: ConfigProvider) {
    }

    public async transform(target: Type): Promise<Record<string, any>> {
        const variables = this.scanner.getVariables(target);
        const instance = new target();

        const undefinedVariableNames = [];
        for (const variable of variables) {
            const variableValue = await this.configProvider.getValue(variable.variableName);
            if (variableValue === null || variableValue === undefined) {
                undefinedVariableNames.push(variable.variableName);
            }

            Object.assign(instance, {
                [variable.propertyKey]: variableValue
            });
        }

        if (undefinedVariableNames.length) {
            if (process.env.NODE_ENV === "test" || !!process.env.CI) {
                console.log(`The following variable must be defined in provider '${this.configProvider.constructor.name}': ${JSON.stringify(undefinedVariableNames)}. Skipping for test mode.`);
            } else {
                throw new Error(`The following variable must be defined in provider '${this.configProvider.constructor.name}': ${JSON.stringify(undefinedVariableNames)}`);
            }
        }

        return instance;
    }
}

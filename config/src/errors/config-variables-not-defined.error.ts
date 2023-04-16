import { Type } from "@nestjs/common";

export class ConfigVariablesNotDefinedError extends Error {
    constructor(configType: Type, variableNames: string[]) {
        const formattedVariableNames = JSON.stringify(variableNames);

        super(`Variables '${formattedVariableNames}' must be defined for config '${configType.name}'`);
    }
}

import { Injectable, Type } from "@nestjs/common";
import { ConfigProvidersRegistry } from "./config-providers.registry";
import { ConfigHandler } from "../handlers/config.handler";
import { ConfigModelNotFoundError } from "../errors/config-model-not-found.error";
import { EnvironmentConfigProvider } from "../providers/environment.config-provider";
import { ConfigProviderHandler } from "../handlers/config-provider.handler";

@Injectable()
export class ConfigTransformerService {
    constructor(private configProviderRegistry: ConfigProvidersRegistry) {
    }

    public async transform(configType: Type): Promise<Record<string, any>> {
        const config = ConfigHandler.getConfig(configType);
        if (!config) {
            throw new ConfigModelNotFoundError(configType);
        }

        const configProviderConfig = ConfigProviderHandler.getConfig(config.provider ?? EnvironmentConfigProvider);
        const configProvider = this.configProviderRegistry.getConfigProvider(configProviderConfig.type);

        const variables = ConfigHandler.getConfig(configType).variables;
        const configInstance = new configType();

        const undefinedVariableNames = [];
        for (const variable of variables) {
            const variableValue = await configProvider.getValue(variable.variableName);
            if (variableValue === null || variableValue === undefined) {
                undefinedVariableNames.push(variable.variableName);
            }

            Object.assign(configInstance, {
                [variable.propertyKey]: variableValue
            });
        }

        if (undefinedVariableNames.length) {
            if (process.env.NODE_ENV === "test" || !!process.env.CI) {
                console.log(`The following variable must be defined in provider '${configProvider.constructor.name}': ${JSON.stringify(undefinedVariableNames)}. Skipping for test mode.`);
            } else {
                throw new Error(`The following variable must be defined in provider '${configProvider.constructor.name}': ${JSON.stringify(undefinedVariableNames)}`);
            }
        }

        return configInstance;
    }
}

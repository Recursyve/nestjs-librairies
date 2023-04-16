import { Inject, Injectable, Type } from "@nestjs/common";
import { ConfigHandler } from "../handlers/config.handler";
import { ConfigModelNotFoundError } from "../errors/config-model-not-found.error";
import { EnvironmentConfigProvider } from "../providers/environment.config-provider";
import { ModuleRef } from "@nestjs/core";
import { ConfigProviderHandler } from "../handlers/config-provider.handler";
import { IConfigProvider } from "../providers/config.provider";
import { ConfigProviderNotRegisteredError } from "../errors/config-provider-not-registered.error";
import { ConfigProviderNotFoundInModuleError } from "../errors/config-provider-not-found-in-module.error";
import { OPTIONS } from "../constant";
import { ConfigModuleOptions } from "../config.module";
import { ConfigVariablesNotDefinedError } from "../errors/config-variables-not-defined.error";
import { plainToInstance } from "class-transformer";

@Injectable()
export class ConfigTransformerService {
    constructor(@Inject(OPTIONS) private options: ConfigModuleOptions, private moduleRef: ModuleRef) {}

    public async transform<T>(configType: Type<T>): Promise<T | never> {
        const config = ConfigHandler.getConfig(configType);
        if (!config) {
            throw new ConfigModelNotFoundError(configType);
        }

        const configProviderType = await ConfigProviderHandler.getConfigProvider(
            config.provider ?? EnvironmentConfigProvider.type
        );
        if (!configProviderType) {
            throw new ConfigProviderNotRegisteredError(config.provider ?? EnvironmentConfigProvider.type);
        }

        const configProvider = await this.moduleRef.resolve<IConfigProvider>(configProviderType, undefined, {
            strict: false
        });
        if (!configProvider) {
            throw new ConfigProviderNotFoundInModuleError(configProviderType);
        }

        const variables = ConfigHandler.getConfig(configType).variables;
        const plainConfig = {};

        const undefinedVariableNames = [];
        for (const variable of variables) {
            const value = await configProvider.getValue(variable.variableName);
            if (variable.required && (value === null || value === undefined || value === "")) {
                undefinedVariableNames.push(variable.variableName);
                continue;
            }

            plainConfig[variable.propertyKey] = value;
        }

        if (undefinedVariableNames.length) {
            if (this.options.skipRequiredFieldsCheck) {
                console.log(
                    `The following variable must be defined in config '${configType.name}': ${JSON.stringify(
                        undefinedVariableNames
                    )}. Requirement skipped.`
                );
            } else {
                throw new ConfigVariablesNotDefinedError(configType, undefinedVariableNames);
            }
        }

        return plainToInstance(configType, plainConfig);
    }
}

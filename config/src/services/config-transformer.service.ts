import type { Type } from "@nestjs/common";
import { Inject, Injectable } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { isNotEmpty } from "@recursyve/nice-ts-utils";
import { plainToInstance } from "class-transformer";

import type { ConfigModuleOptions } from "../config.module.options";
import { OPTIONS } from "../constant";
import { ConfigModelNotFoundError } from "../errors/config-model-not-found.error";
import { ConfigVariablesNotDefinedError } from "../errors/config-variables-not-defined.error";
import { ConfigProviderHandler } from "../handlers/config-provider.handler";
import { ConfigHandler } from "../handlers/config.handler";
import type { ConfigMetadata } from "../models/config-metadata.model";
import type { IConfigProvider } from "../providers/config.provider";
import { EnvironmentConfigProvider } from "../providers/environment.config-provider";

@Injectable()
export class ConfigTransformerService {
    constructor(
        @Inject(OPTIONS) private readonly options: ConfigModuleOptions,
        private readonly moduleRef: ModuleRef
    ) {}

    public async transform<T>(configType: Type<T>): Promise<T | null> {
        const configMetadata = this.getConfigMetadata(configType);
        const configProvider = await this.getConfigProvider(configMetadata.provider ?? EnvironmentConfigProvider.type);

        const config = await this.loadConfig(configType, configProvider);
        await configProvider.hydrate?.(config as object);
        return config;
    }

    public async reloadConfig(
        config: object,
        options?: {
            getValue?: unknown;
        }
    ): Promise<void> {
        const configType = config.constructor as Type<Record<string, unknown>>;

        const configMetadata = this.getConfigMetadata(configType);
        if (!isNotEmpty(configMetadata.provider)) {
            return;
        }
        const configProvider = await this.getConfigProvider(configMetadata.provider);

        const reloadedValues = await this.loadConfig(configType, configProvider, options);
        const mutableConfig = config as Record<string, unknown>;

        for (const key of Object.keys(reloadedValues)) {
            if (
                !Object.hasOwn(config, key) ||
                !configMetadata.variables.some((variable) => variable.propertyKey === key)
            ) {
                continue;
            }

            mutableConfig[key] = reloadedValues[key];
        }
    }

    private async loadConfig<T>(
        configType: Type<T>,
        configProvider: IConfigProvider,
        options?: {
            getValue?: unknown;
        }
    ): Promise<T> {
        const variables = ConfigHandler.getConfig(configType).variables;
        const plainConfig: Record<string, unknown> = {};

        const undefinedVariableNames: string[] = [];
        for (const variable of variables) {
            const variableName = variable.variableName;
            if (!isNotEmpty(variableName)) {
                continue;
            }

            const value = await configProvider.getValue(variableName, options?.getValue);
            if (variable.required === true && !isNotEmpty(value)) {
                undefinedVariableNames.push(variableName);
                continue;
            }

            plainConfig[variable.propertyKey] = value;
        }

        if (undefinedVariableNames.length > 0) {
            if (this.options.skipRequiredFieldsCheck === true) {
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

    private getConfigMetadata(configType: Type): ConfigMetadata {
        const configMetadata = ConfigHandler.getConfig(configType);
        if (configMetadata.variables.length === 0 && configMetadata.provider === undefined) {
            throw new ConfigModelNotFoundError(configType);
        }

        return configMetadata;
    }

    private async getConfigProvider(provider: string): Promise<IConfigProvider> {
        const configProviderType = ConfigProviderHandler.getConfigProvider(provider);

        return this.moduleRef.resolve<IConfigProvider>(configProviderType, undefined, {
            strict: false
        });
    }
}

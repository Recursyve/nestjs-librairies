import "reflect-metadata";

import type { Type } from "@nestjs/common";

import { CONFIG } from "../constant";
import type { ConfigMetadata } from "../models/config-metadata.model";
import type { VariableMetadata } from "../models/variable-metadata.model";

function readStoredConfig(target: Type): ConfigMetadata | undefined {
    if (!Reflect.hasMetadata(CONFIG, target)) {
        return undefined;
    }

    return Reflect.getMetadata(CONFIG, target) as ConfigMetadata;
}

export namespace ConfigHandler {
    export function getVariable(target: Type, propertyKey: string): VariableMetadata | null {
        const config = getConfig(target);
        return config.variables.find((variable) => variable.propertyKey === propertyKey) ?? null;
    }

    export function saveVariable(target: Type, variableConfig: VariableMetadata): void {
        const config = getConfig(target);

        const variableIndex = config.variables.findIndex(
            (variable) => variable.propertyKey === variableConfig.propertyKey
        );

        if (variableIndex >= 0) {
            config.variables[variableIndex] = variableConfig;
        } else {
            config.variables.push(variableConfig);
        }

        saveConfig(target, config);
    }

    export function getConfig(target: Type): ConfigMetadata {
        const config = readStoredConfig(target) ?? { variables: [] };

        return {
            ...config,
            variables: [...config.variables]
        };
    }

    export function saveConfig(target: Type, config: ConfigMetadata): void {
        Reflect.defineMetadata(CONFIG, config, target);
    }
}

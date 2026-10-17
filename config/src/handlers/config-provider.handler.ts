import "reflect-metadata";

import type { Type } from "@nestjs/common";

import { CONFIG_PROVIDER } from "../constant";
import { ConfigProviderNotRegisteredError } from "../errors/config-provider-not-registered.error";
import type { ConfigProviderMetadata } from "../models/config-provider-metadata.model";
import type { IConfigProvider } from "../providers/config.provider";

const configProviders = new Map<string, Type<IConfigProvider>>();

function readStoredConfig(target: Type): ConfigProviderMetadata | undefined {
    if (!Reflect.hasMetadata(CONFIG_PROVIDER, target)) {
        return undefined;
    }

    return Reflect.getMetadata(CONFIG_PROVIDER, target) as ConfigProviderMetadata;
}

export namespace ConfigProviderHandler {
    export function setType(target: Type, type: string): void {
        updateConfig(target, (config) => ({ ...config, type }));
    }

    export function getConfigProvider(type: string): Type<IConfigProvider> {
        const provider = configProviders.get(type);
        if (!provider) {
            throw new ConfigProviderNotRegisteredError(type);
        }

        return provider;
    }

    export function getConfig(target: Type): ConfigProviderMetadata {
        const config = readStoredConfig(target) ?? { type: "" };
        return { ...config };
    }

    export function saveConfig(target: Type, config: ConfigProviderMetadata): void {
        const previous = readStoredConfig(target);
        Reflect.defineMetadata(CONFIG_PROVIDER, config, target);

        if (previous !== undefined) {
            configProviders.delete(previous.type);
        }

        configProviders.set(config.type, target as Type<IConfigProvider>);
    }

    export function updateConfig(
        target: Type,
        callback: (config: ConfigProviderMetadata) => ConfigProviderMetadata
    ): void {
        const config = getConfig(target);
        saveConfig(target, callback(config));
    }
}

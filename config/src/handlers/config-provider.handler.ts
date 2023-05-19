import { Type } from "@nestjs/common";
import { ConfigProviderMetadata } from "../models/config-provider-metadata.model";
import { CONFIG_PROVIDER } from "../constant";
import "reflect-metadata";
import { IConfigProvider } from "../providers/config.provider";

export class ConfigProviderHandler {
    private static _configProviders: Record<string, Type<IConfigProvider>> = {};

    public static setType(target: Type, type: string): void {
        this.updateConfig(target, (config) => ({ ...config, type }));
    }

    public static getConfigProvider(type: string): Type<IConfigProvider> {
        return this._configProviders[type];
    }

    public static getConfig(target: Type): ConfigProviderMetadata {
        const config = Reflect.getMetadata(CONFIG_PROVIDER, target);
        return {
            ...config,
        };
    }

    public static saveConfig(target: Type, config: ConfigProviderMetadata): void {
        const oldConfig = this.getConfig(target);
        Reflect.defineMetadata(CONFIG_PROVIDER, config, target);

        if (oldConfig) {
            delete this._configProviders[oldConfig.type];
        }

        this._configProviders[config.type] = target;
    }

    public static updateConfig(
        target: Type,
        callback: (config: ConfigProviderMetadata) => ConfigProviderMetadata
    ): void {
        const config = this.getConfig(target);
        this.saveConfig(target, callback(config));
    }
}

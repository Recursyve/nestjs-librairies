import { Type } from "@nestjs/common";
import { ConfigProviderMetadata } from "../models/config-provider-metadata.model";
import { CONFIG_PROVIDER } from "../constant";
import "reflect-metadata";

export class ConfigProviderHandler {
    public static setType(target: Type, type: string): void {
        this.updateConfig(target, (config) => ({ ...config, type }));
    }

    public static getConfig(target: Type): ConfigProviderMetadata {
        const config = Reflect.getMetadata(CONFIG_PROVIDER, target);
        return {
            ...config,
        };
    }

    public static saveConfig(target: Type, config: ConfigProviderMetadata): void {
        Reflect.defineMetadata(CONFIG_PROVIDER, config, target);
    }

    public static updateConfig(
        target: Type,
        callback: (config: ConfigProviderMetadata) => ConfigProviderMetadata
    ): void {
        const config = this.getConfig(target);
        this.saveConfig(target, callback(config));
    }
}

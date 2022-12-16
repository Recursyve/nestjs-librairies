import { Type } from "@nestjs/common";
import { ConfigProviderConfig } from "../models/config-provider.config";
import { CONFIG_PROVIDER } from "../constant";

export class ConfigProviderHandler {
    public static getConfig(target: Type): ConfigProviderConfig {
        return Reflect.getMetadata(CONFIG_PROVIDER, target) ?? {};
    }

    public static saveConfig(target: Type, config: ConfigProviderConfig): void {
        Reflect.defineMetadata(CONFIG_PROVIDER, config, target);
    }

    public static setType(target: Type, type: string): void {
        const config = this.getConfig(target);
        config.type = type;
        this.saveConfig(target, config);
    }
}

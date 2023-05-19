import { ConfigConfig } from "../models/config-metadata.model";
import { ConfigHandler } from "../handlers/config.handler";
import { EnvironmentConfigProvider } from "../providers/environment.config-provider";

export const Config = (config: ConfigConfig = {}): ClassDecorator => {
    return (target: any) => {
        const targetConfig = ConfigHandler.getConfig(target);
        Object.assign(targetConfig, config);
        ConfigHandler.saveConfig(target, targetConfig);
    };
};

export const EnvironmentConfig = (config: Omit<ConfigConfig, "provider"> = {}): ClassDecorator => {
    (config as ConfigConfig).provider = EnvironmentConfigProvider.type;
    return Config(config);
};

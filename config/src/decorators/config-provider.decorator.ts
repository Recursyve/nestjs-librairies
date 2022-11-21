import { Type } from "@nestjs/common";
import { ConfigProvider as ConfigProviderInterface } from "../providers/config-provider";
import { ConfigHandler } from "../handlers/config.handler";

export const ConfigProvider = (provider: Type<ConfigProviderInterface>): ClassDecorator => {
    return (target: Object) => {
        const config = ConfigHandler.getConfig(target);
        config.provider = provider;
        ConfigHandler.saveConfig(target, config);
    };
};

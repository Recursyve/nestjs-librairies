import { ConfigConfig } from "../models/config.model";
import { ConfigHandler } from "../handlers/config.handler";

export const Config = (config: Partial<ConfigConfig>): ClassDecorator => {
    return (target: any) => {
        const targetConfig = ConfigHandler.getConfig(target);
        Object.assign(targetConfig, config);
        ConfigHandler.saveConfig(target, targetConfig);
    };
}

import type { Type } from "@nestjs/common";

import { ConfigHandler } from "../handlers/config.handler";
import type { ConfigConfig } from "../models/config-metadata.model";
import { EnvironmentConfigProvider } from "../providers/environment.config-provider";

export function Config(config: ConfigConfig = {}): ClassDecorator {
    return (target) => {
        const targetType = target as unknown as Type;
        const targetConfig = ConfigHandler.getConfig(targetType);
        ConfigHandler.saveConfig(targetType, { ...targetConfig, ...config });
    };
}

export function EnvironmentConfig(): ClassDecorator {
    return Config({ provider: EnvironmentConfigProvider.type });
}

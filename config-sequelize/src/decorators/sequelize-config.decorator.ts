import { SequelizeConfigProvider } from "../providers/sequelize.config-provider";
import { Config, ConfigConfig } from "@recursyve/nestjs-config";

export const SequelizeConfig = (config: Omit<ConfigConfig, "provider"> = {}): ClassDecorator => {
    (config as ConfigConfig).provider = SequelizeConfigProvider.type;
    return Config(config);
};

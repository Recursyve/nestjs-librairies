import { Config } from "@recursyve/nestjs-config";

import { SequelizeConfigProvider } from "../providers/sequelize.config-provider";

export function SequelizeConfig(): ClassDecorator {
    return Config({ provider: SequelizeConfigProvider.type });
}

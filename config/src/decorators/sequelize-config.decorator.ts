import { ConfigProviderHandler } from "../handlers/config-provider.handler";

export const SequelizeConfig = (): ClassDecorator => {
    return (target: any) => {
        ConfigProviderHandler.setType(target, "sequelize")
    };
};

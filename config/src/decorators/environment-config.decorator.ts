import { ConfigProviderHandler } from "../handlers/config-provider.handler";

export const EnvironmentConfigDecorator = (): ClassDecorator => {
    return (target: any) => {
        ConfigProviderHandler.setType(target, "environment");
    };
};

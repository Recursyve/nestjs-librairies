import { ConfigProviderHandler } from "../handlers/config-provider.handler";

export const ConfigProvider = (type: string): ClassDecorator => {
    return (target: any) => {
        ConfigProviderHandler.setType(target.constructor, "environment");
    };
};

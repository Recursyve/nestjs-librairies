import type { Type } from "@nestjs/common";

import { ConfigProviderHandler } from "../handlers/config-provider.handler";

export const ConfigProvider = (type: string): ClassDecorator => {
    return (target) => {
        ConfigProviderHandler.setType(target as unknown as Type, type);
    };
};

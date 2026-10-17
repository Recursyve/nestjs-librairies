import { Injectable } from "@nestjs/common";

import { ConfigProvider } from "../decorators/config-provider.decorator";
import type { IConfigProvider } from "./config.provider";

@Injectable()
@ConfigProvider(EnvironmentConfigProvider.type)
export class EnvironmentConfigProvider implements IConfigProvider {
    public static readonly type = "environment" as const;

    public async getValue(key: string): Promise<string | null | undefined> {
        return Promise.resolve(process.env[key]);
    }
}

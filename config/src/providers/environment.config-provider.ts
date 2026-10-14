import { Injectable } from "@nestjs/common";

import { ConfigProvider } from "../decorators";
import type { IConfigProvider } from "./config.provider";

@Injectable()
@ConfigProvider(EnvironmentConfigProvider.type)
export class EnvironmentConfigProvider implements IConfigProvider {
    static type = "environment" as const;

    public getValue(key: string): Promise<string | null> {
        return Promise.resolve(process.env[key] as string);
    }
}

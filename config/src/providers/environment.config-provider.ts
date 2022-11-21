import { Injectable } from "@nestjs/common";
import { ConfigProvider } from "./config-provider";

@Injectable()
export class EnvironmentConfigProvider implements ConfigProvider {
    public getValue(key: string): Promise<string> {
        return Promise.resolve(process.env[key]);
    }
}

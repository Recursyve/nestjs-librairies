import { Injectable } from "@nestjs/common";
import { IConfigProvider } from "./config.provider";

@Injectable()
export class EnvironmentConfigProvider implements IConfigProvider {
    public getValue(key: string): Promise<string> {
        return Promise.resolve(process.env[key]);
    }
}

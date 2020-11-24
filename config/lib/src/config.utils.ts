import { Type } from "@nestjs/common";

export class ConfigUtils {
    public static getProviderToken(config: Type<any>): string {
        return `${config.name}Service`;
    }
}

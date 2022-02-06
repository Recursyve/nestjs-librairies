import { Type } from "@nestjs/common";

export class ConfigUtils {
    public static getProviderToken(config: Type): string {
        return `${config.name}Service`;
    }
}

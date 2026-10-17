import type { Type } from "@nestjs/common";

export namespace ConfigUtils {
    export function getProviderToken(config: Type): string {
        return `${config.name}Service`;
    }
}

import { Type } from "@nestjs/common";

export class ConfigProviderConfigNotFoundError extends Error {
    constructor(providerTarget: Type) {
        super(`Config not found for config provider '${providerTarget.name}'. Make sure a config has been registered for it.`);
    }
}

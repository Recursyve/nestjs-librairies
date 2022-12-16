import { Type } from "@nestjs/common";

export class ConfigProviderNotFoundInModuleError extends Error {
    constructor(providerTarget: Type) {
        super(`Config provider '${providerTarget.name}' not found in module.`);
    }
}

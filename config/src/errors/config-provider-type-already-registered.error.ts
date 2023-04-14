import { Type } from "@nestjs/common";

export class ConfigProviderTypeAlreadyRegisteredError extends Error {
    constructor(type: string, cType: Type) {
        super(`Tried registering a config provider for type '${type}' (${cType.name}), but it was already registered.`);
    }
}

export class ConfigProviderNotRegisteredError extends Error {
    constructor(type: string) {
        super(`Config provider with type '${type}' has not been registered. Make sure to register it before retrieving it.`);
    }
}

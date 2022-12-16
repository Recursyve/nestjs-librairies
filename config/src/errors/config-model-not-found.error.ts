import { Type } from "@nestjs/common";

export class ConfigModelNotFoundError extends Error {
    constructor(configType: Type) {
        super(`Not config model found for '${configType.name}. Make sure that either at least one variable is defined, or the model is annotated with a config provider.`);
    }
}

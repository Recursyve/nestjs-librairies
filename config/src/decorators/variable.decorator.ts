import type { Type } from "@nestjs/common";

import { ConfigHandler } from "../handlers/config.handler";
import type { VariableConfig } from "../models/variable-metadata.model";

export function Variable(requiredOrVariableNameOrConfig: VariableConfig | boolean | string): PropertyDecorator;
export function Variable(target: object, propertyKey: string | symbol): void;
export function Variable(
    requiredOrVariableNameOrConfigOrTarget?: VariableConfig | boolean | object | string,
    propertyKey?: string | symbol
): PropertyDecorator | void {
    if (propertyKey !== undefined) {
        annotate(getClassFromDecoratorTarget(requiredOrVariableNameOrConfigOrTarget as object), String(propertyKey));
        return;
    }

    const config = parseVariableConfig(requiredOrVariableNameOrConfigOrTarget);

    return (target, key) => {
        annotate(getClassFromDecoratorTarget(target), String(key), config);
    };
}

function getClassFromDecoratorTarget(target: object): Type {
    return (target as { constructor: Type }).constructor;
}

function parseVariableConfig(requiredOrVariableNameOrConfig?: VariableConfig | boolean | string): VariableConfig {
    if (requiredOrVariableNameOrConfig === undefined) {
        return {};
    }

    if (typeof requiredOrVariableNameOrConfig === "object") {
        return requiredOrVariableNameOrConfig;
    }

    if (typeof requiredOrVariableNameOrConfig === "boolean") {
        return {
            required: requiredOrVariableNameOrConfig
        };
    }

    return {
        variableName: requiredOrVariableNameOrConfig
    };
}

function annotate(target: Type, propertyKey: string, config: VariableConfig = {}): void {
    let variable = ConfigHandler.getVariable(target, propertyKey);
    variable ??= { propertyKey };
    variable = { ...variable, ...config };

    variable.variableName ??= propertyKey;
    variable.required ??= true;

    ConfigHandler.saveVariable(target, variable);
}

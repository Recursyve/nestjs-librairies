import { VariableConfig, VariableMetadata } from "../models/variable-metadata.model";
import { ConfigHandler } from "../handlers/config.handler";
import { Type } from "@nestjs/common";

export function Variable(requiredOrVariableNameOrConfig: boolean | string | VariableConfig): PropertyDecorator;
export function Variable(target: Object, propertyKey: string): void;
export function Variable(...args: any[]): PropertyDecorator {
    if (args.length >= 2) {
        const [target, propertyName] = args;

        annotate(target.constructor, propertyName);
        return;
    }

    return (target: Object, propertyKey: string) => {
        const [requiredOrVariableNameOrConfig] = args;

        let config: VariableConfig;

        if (typeof requiredOrVariableNameOrConfig === "object") {
            config = requiredOrVariableNameOrConfig;
        } else if (typeof requiredOrVariableNameOrConfig === "boolean") {
            config = {
                required: requiredOrVariableNameOrConfig,
            };
        } else {
            config = {
                variableName: requiredOrVariableNameOrConfig,
            };
        }

        annotate(target.constructor as any, propertyKey, config);
    };
}

function annotate(target: Type, propertyKey: string, config: VariableConfig = {}) {
    let variable = ConfigHandler.getVariable(target, propertyKey);
    if (!variable) {
        variable = {
            propertyKey,
        } as VariableMetadata;
    }
    variable = {
        ...variable,
        ...config,
    };

    if (!variable.variableName) {
        variable.variableName = propertyKey;
    }

    if (typeof variable.required === "undefined") {
        variable.required = true;
    }

    ConfigHandler.saveVariable(target, variable);
}

import { ConfigModel } from "../models/config.model";
import "reflect-metadata";
import { CONFIG } from "../constant";
import { VariableModel } from "../models/variable.model";
import { Type } from "@nestjs/common";

export class ConfigHandler {
    public static getConfig(target: Type<any>): ConfigModel {
        return Reflect.getMetadata(CONFIG, target) ?? { variables: [] };
    }

    public static saveConfig(target: Type<any>, config: ConfigModel): void {
        Reflect.defineMetadata(CONFIG, config, target);
    }

    public static getVariable(target: Type<any>, propertyKey: string): VariableModel {
        const config = ConfigHandler.getConfig(target);
        if (!config?.variables) {
            return null;
        }

        return config.variables.find(variable => variable.propertyKey === propertyKey);
    }

    public static saveVariable(target: Type<any>, variableConfig: VariableModel): void {
        const config = ConfigHandler.getConfig(target);

        const variableIndex = config.variables.findIndex(variable => variable.propertyKey === variableConfig.propertyKey);
        if (variableIndex >= 0) {
            config.variables[variableIndex] = variableConfig;
        } else {
            config.variables.push(variableConfig);
        }

        ConfigHandler.saveConfig(target, config);
    }
}

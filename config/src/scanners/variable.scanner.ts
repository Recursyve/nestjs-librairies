import { Injectable } from "@nestjs/common";
import { VariableModel } from "../models/variable.model";
import { ConfigHandler } from "../handlers/config.handler";

@Injectable()
export class VariableScanner {
    public getVariables(target: any): VariableModel[] {
        return ConfigHandler.getConfig(target)?.variables;
    }
}

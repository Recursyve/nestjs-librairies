import { Injectable } from "@nestjs/common";
import { VARIABLES } from "../constant";
import { VariableModel } from "../models/variable.model";

@Injectable()
export class VariableScanner {
    public getVariables(target: any): VariableModel[] {
        return Reflect.getMetadata(VARIABLES, target.prototype) ?? [];
    }
}

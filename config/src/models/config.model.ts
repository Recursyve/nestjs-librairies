import { IConfigProvider } from "../providers/i-config-provider";
import { VariableModel } from "./variable.model";
import { Type } from "@nestjs/common";

export interface ConfigModel extends ConfigConfig {
    variables: VariableModel[];
}

export interface ConfigConfig {
    provider?: Type<IConfigProvider>;
}

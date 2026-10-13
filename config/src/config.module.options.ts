import { Type } from "@nestjs/common";

export interface ConfigModuleOptions {
    configs?: Type[];
    skipRequiredFieldsCheck?: boolean;
}
import { VariableMetadata } from "./variable-metadata.model";

export interface ConfigConfig {
    provider?: string;
}

export interface ConfigMetadata extends ConfigConfig {
    variables: VariableMetadata[];
}

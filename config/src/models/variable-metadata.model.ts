export interface VariableConfig {
    variableName?: string;
    required?: boolean;
}

export interface VariableMetadata extends VariableConfig {
    propertyKey: string;
}

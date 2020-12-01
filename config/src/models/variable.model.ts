export interface VariableModel extends VariableConfig {
    propertyKey: string;
}

export interface VariableConfig {
    variableName?: string;
    required?: boolean;
}

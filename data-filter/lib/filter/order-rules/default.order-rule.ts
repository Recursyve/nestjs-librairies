export interface DefaultOrderRuleDefinition {
    column: string;
    direction: "asc" | "desc" | "";
    nullLast?: boolean;
}

export class DefaultOrderRule {
    private _type = "default_order_rule";

    constructor(public order: DefaultOrderRuleDefinition) {}

    public static validate(definition: DefaultOrderRuleDefinition) {
        return definition["_type"] === "default_order_rule";
    }
}

import { QueryModel, QueryRuleModel } from "../..";

export interface DefaultFilterDefinition {
    filter: QueryRuleModel | QueryModel;
    required: boolean;
}

export class DefaultFilter implements DefaultFilterDefinition {
    private _type = "default_filter";

    constructor(public filter: QueryRuleModel | QueryModel, public required = true) {}

    public static validate(definition: DefaultFilterDefinition) {
        return definition["_type"] === "default_filter";
    }
}

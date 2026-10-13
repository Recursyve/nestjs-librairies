import type { IRule } from "../..";
import { QueryModel, QueryRuleModel } from "../..";

export interface DefaultFilterDefinition {
    filter: QueryRuleModel | QueryModel;
    required: boolean;
}

export class DefaultFilter implements DefaultFilterDefinition, IRule {
    public readonly _type = "default_filter";

    constructor(
        public filter: QueryRuleModel | QueryModel,
        public required = true
    ) {}

    public static validate(definition: IRule): boolean {
        return definition["_type"] === "default_filter";
    }
}

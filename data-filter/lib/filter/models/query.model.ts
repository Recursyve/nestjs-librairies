import { RuleModel } from "./rule.model";

export type Condition = "and" | "or";

export interface QueryRuleModel extends RuleModel {
    id: string;
}

export interface QueryModel {
    condition: Condition;
    rules: (QueryRuleModel | QueryModel)[];
}

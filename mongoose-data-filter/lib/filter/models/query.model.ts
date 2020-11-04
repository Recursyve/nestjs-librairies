import { Condition } from "../filters/filter";
import { RuleModel } from "./rule.model";

export interface QueryRuleModel extends RuleModel {
    id: string;
}

export interface QueryModel {
    condition: Condition;
    rules: (QueryRuleModel | QueryModel)[];
}

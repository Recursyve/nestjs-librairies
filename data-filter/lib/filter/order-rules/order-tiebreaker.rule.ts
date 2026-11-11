import { IRule } from "../models";

export interface OrderTiebreakerRuleDefinition {
    column: string;
    /** When omitted, use the last effective user order direction, else `"asc"`. */
    direction?: "asc" | "desc" | "";
    nullLast?: boolean;
}

export class OrderTiebreakerRule implements IRule {
    public readonly _type = "order_tiebreaker_rule";

    constructor(public order: OrderTiebreakerRuleDefinition | OrderTiebreakerRuleDefinition[]) {}

    public static validate(definition: IRule): boolean {
        return definition["_type"] === "order_tiebreaker_rule";
    }
}

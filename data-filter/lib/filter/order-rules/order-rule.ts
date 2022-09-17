import { Col, Fn, Literal } from "sequelize/types/utils";
import { M } from "../../sequelize.utils";

export type OrderItemColumn = string | Col | Fn | Literal;

export interface BaseOrderRuleDefinition {
    attribute: string;
    path?: string;
}

export interface OrderRuleDefinition extends BaseOrderRuleDefinition {
    getOrderOption(model: typeof M): OrderItemColumn;
}

export abstract class OrderRule implements OrderRuleDefinition {
    private _type = "order_rule";

    public attribute: string;
    public path?: string;

    protected constructor(definition?: BaseOrderRuleDefinition) {
        if (definition) {
            Object.assign(this, definition);
        }
    }

    public static validate(definition: BaseOrderRuleDefinition) {
        return definition["_type"] === "order_rule";
    }

    public abstract getOrderOption(model: typeof M): OrderItemColumn;
}

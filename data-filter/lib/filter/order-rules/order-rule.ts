import { Col, Fn, Literal } from "sequelize/types/utils";

import type { DataFilterUserModel } from "../../models/user.model";
import { M } from "../../sequelize.utils";
import type { IRule } from "../models";

export type OrderItemColumn = string | Col | Fn | Literal;

export interface BaseOrderRuleDefinition {
    attribute: string;
    path?: string;
}

export type OrderRuleContext<Request = unknown> = {
    request: Request;
    user: DataFilterUserModel | null;
};

export interface OrderRuleDefinition extends BaseOrderRuleDefinition, IRule {
    getOrderOption(model: typeof M, context: OrderRuleContext): OrderItemColumn;
}

export abstract class OrderRule implements OrderRuleDefinition {
    public readonly _type = "order_rule";

    public attribute!: string;
    public path?: string;

    protected constructor(definition?: BaseOrderRuleDefinition) {
        if (definition) {
            Object.assign(this, definition);
        }
    }

    public static validate(definition: IRule): boolean {
        return definition["_type"] === "order_rule";
    }

    public abstract getOrderOption(model: typeof M, context: OrderRuleContext): OrderItemColumn;
}

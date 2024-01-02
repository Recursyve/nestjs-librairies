import { Col, Fn, Literal } from "sequelize/types/utils";
import { M } from "../../sequelize.utils";
import { DialectFormatterService } from "../../services/dialect-formatter.service";

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

    protected _dialectFormatterService: DialectFormatterService;

    public attribute: string;
    public path?: string;

    public set dialectFormatterService(dialectFormatterService: DialectFormatterService) {
        this._dialectFormatterService = dialectFormatterService;
    }

    protected constructor(definition?: BaseOrderRuleDefinition) {
        if (definition) {
            Object.assign(this, definition);
        }
    }

    public static validate(definition: BaseOrderRuleDefinition) {
        return definition?.["_type"] === "order_rule";
    }

    public abstract getOrderOption(model: typeof M): OrderItemColumn;
}

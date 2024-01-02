import { literal } from "sequelize";
import { M } from "../../sequelize.utils";
import { BaseOrderRuleDefinition, OrderItemColumn, OrderRule } from "./order-rule";

export class IsNullOrderRule extends OrderRule {
    constructor(definition: BaseOrderRuleDefinition) {
        super(definition);
    }

    public getOrderOption(model: typeof M): OrderItemColumn {
        const order = `${this.path ? this._dialectFormatterService.getLiteralFullName(this.attribute, this.path) : this._dialectFormatterService.formatCol(model.name, this.attribute)} IS NULL`;
        return literal(order);
    }
}

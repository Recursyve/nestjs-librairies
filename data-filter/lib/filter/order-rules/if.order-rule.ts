import { col, fn, literal } from "sequelize";
import { M, SequelizeUtils } from "../../sequelize.utils";
import { BaseOrderRuleDefinition, OrderItemColumn, OrderRule } from "./order-rule";

export interface IfOrderRuleDefinition {
    valueEquals: any;
    priority?: number;
    fallbackPriority?: number;
}

export class IfOrderRule extends OrderRule implements IfOrderRuleDefinition {
    public valueEquals: any;
    public priority: any;
    public fallbackPriority: any;

    constructor(definition: BaseOrderRuleDefinition & IfOrderRuleDefinition) {
        super(definition);
    }

    public getOrderOption(model: typeof M): OrderItemColumn {
        const order = `IF(${this.path ? this._dialectFormatterService.getLiteralFullName(this.attribute, this.path) : this._dialectFormatterService.formatCol(model.name, this.attribute)}='${this.valueEquals}',${this.priority ?? 1},${this.fallbackPriority ?? 0})`;
        return literal(order);
    }
}
